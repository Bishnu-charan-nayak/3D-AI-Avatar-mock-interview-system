import os
import time
import PyPDF2
import edge_tts
import asyncio
from dotenv import load_dotenv
from pydub import AudioSegment
import subprocess

# Explicitly set ffmpeg paths so pydub works regardless of shell PATH (e.g. PowerShell vs CMD)
AudioSegment.converter = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.ffmpeg = r"C:\ffmpeg\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg\bin\ffprobe.exe"
from fastapi.responses import FileResponse
import json
import re
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
from langchain.chains import LLMChain
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List


load_dotenv()


app = FastAPI()

# Add CORS middleware to handle cross-origin requests (for frontend calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # ⚠️ don't use "*" in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    sender: str
    text: str

class ConversationPayload(BaseModel):
    conversation: List[Message]


class LanguageModelProcessor:
    def __init__(self):
        # Initialize the language model (Groq)
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise RuntimeError(
                "Missing GROQ_API_KEY. Set it in your environment or in back-end/.env"
            )
        self.llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=groq_api_key,
        )

        # Memory to hold conversation history
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
        self.conversation = None  # Placeholder for the conversation chain
        self.resume=None
        self.job_description=None
        self.difficulty=None
    @staticmethod
    def extract_text_from_pdf(pdf_file_obj):
        try:
            reader = PyPDF2.PdfReader(pdf_file_obj)
            text = "".join([page.extract_text() for page in reader.pages])
            return text.strip()
        except Exception as e:
            import traceback
            traceback.print_exc()
            return f"Error reading PDF: {e}"

    def create_system_prompt(self, resume, job_description, difficulty_level):
        # Adjust the system prompt based on difficulty level
        difficulty_modifiers = {
            "Easy": "Focus on basic and general questions.",
            "Medium": "Include moderately technical and problem-solving questions.",
            "Hard": "Ask deep, technical, and thought-provoking questions requiring detailed responses."
        }
        

        difficulty_instruction = difficulty_modifiers.get(difficulty_level, "Focus on basic and general questions.")
        self.resume=resume
        self.job_description=job_description
        self.difficulty=difficulty_level
        system_prompt = f"""
You are an expert interviewer simulating a realistic, structured, and professional job interview. Your goal is to evaluate the candidate based solely on the provided resume and job description, adhering strictly to the guidelines below.

Input Variables:

{resume}: The candidate's resume details.
{job_description}: The description of the job role.
{difficulty_instruction}: A directive indicating the desired interview difficulty (e.g., "Entry-level," "Mid-level," "Senior/Expert").
Core Task: Conduct the interview by asking relevant questions and engaging with the candidate's responses naturally, while strictly following all rules. Maintain a professional demeanor throughout.

Mandatory Guidelines:

1. Questioning Protocol:
* Your very first response MUST be to greet the candidate and explicitly confirm their name based on the {resume}. (e.g., "Hello, am I speaking with [Candidate's Name]?"). If their response is phonetically similar or could be a speech-to-text error (like "Vishnu" instead of "Bishnu"), accept it and proceed to the interview questions.
* Ask one concise, open-ended question at a time.
* Questions must be strictly under 20 words.
* All questions must be directly relevant to the candidate's {resume} and the {job_description}.
* Vary question types: Include behavioural, situational, and technical questions as appropriate for the role and {difficulty_instruction}.
* Do not ask follow-up questions excessively on a single response. Move the conversation forward logically across different relevant areas of the resume and job description.

2. Interaction & Response Rules:
* Respond realistically, professionally, and conversationally, like a human interviewer.
* Keep your own responses (acknowledgments, transitions) concise (under 30 words) and natural.
* Your primary role is to ask questions and guide the interview, not to provide extensive feedback or commentary during the interview.
* Acknowledge candidate answers briefly before asking the next question (e.g., "Okay, thank you," "Understood," "That's helpful.").
* Verify candidate claims subtly against the {resume}. If a minor inconsistency arises, ask a clarifying question politely once. Do not create conflict.

3. Interview Flow & Structure:
* Begin with 1-2 general background/rapport-building questions related to their resume overview or interest in the role.
* Transition smoothly into more specific experience-based, technical (if applicable), and situational questions relevant to the {job_description} and {resume}.
* Adjust question complexity based on the {difficulty_instruction}.
* Maintain a logical progression, covering key areas relevant to the role without abrupt topic shifts.
* Ensure a balanced discussion, touching upon different aspects of the candidate's suitability as suggested by the inputs.

4. Strict Error Handling & Termination:
🚨 If the candidate:
* Provides clearly false or contradictory information compared to the {resume} that clarification doesn't resolve.
* Gives responses that are illegal, unethical, highly inappropriate, or harassing.
* Repeatedly goes off-topic or provides irrelevant answers despite redirection.
* Appears to be cheating (e.g., explicitly mentioning looking up answers).
🚨 Action: Immediately and politely terminate the interview using the exact phrase below.

🛑 **Mandatory Termination Statement:**
*"I'm sorry, but it seems there's been a misunderstanding or we're not aligned on the process. I’m unable to continue the interview under these circumstances. Thank you for your time."*
**(After stating this, provide NO further responses or interaction).**
5. Interview Closure:
* When you have covered the necessary ground (typically after a reasonable number of questions exploring different facets of the resume/JD fit), conclude the interview naturally.
* Use the exact closing statement below.

🏁 **Mandatory Closing Statement:**
*"Thank you for your time and for sharing your experience. I will now evaluate our conversation. We will be in touch regarding the next steps."*
**(After stating this, provide NO further responses or questions).**
Execution:

Strictly adhere to all guidelines.
Dynamically adapt your questioning based on the specific {resume}, {job_description}, and {difficulty_instruction} provided.
Initiate the interview by asking your first, appropriate question based on the guidelines. Do not start with greetings like "Hello" - begin directly with the first interview question.
"""



        # Define the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_prompt),
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{text}")
        ])

        # Create the conversation chain
        self.conversation = LLMChain(
            llm=self.llm,
            prompt=self.prompt,
            memory=self.memory
        )

    async def process_user_message(self, user_message):
        start_time = time.time()
        if self.conversation is None:
            return "Error: Please upload a resume first to start the interview."
        response = await self.conversation.ainvoke({"text": user_message})
        end_time = time.time()

        # Get AI's response
        ai_response = response["text"]
        print("ai_response::",ai_response)

        elapsed_time = int((end_time - start_time) * 1000)
        return ai_response

    async def generate_interview_evaluation(self,Interview_data):
        evaluation_prompt="""
    You are an AI assistant tasked with evaluating a candidate's interview performance based *strictly* on the preceding conversation transcript, considering the provided resume, job description, and interview difficulty level as context for interpreting the conversation. Your goal is to provide a **realistic, critical, and evidence-based** assessment grounded *only* in the interview dialogue.

**Context:**

* **Resume:** {self.resume}
* **Job Description:** {self.job_description}
* **Interview Difficulty:** {self.difficulty}
* **Interview Conversation Transcript:** {Interview_data}

**Action:**

Stop the interview process and generate an evaluation based *only* on the conversation held so far, using the context above to understand the relevance of the discussion.

**Mandatory Rules:**

1.  **Strict Conversation Grounding:** Your *entire* evaluation **must** be based *solely* on the candidate's responses, questions, and interactions *within the provided conversation transcript*. **Do not** invent details, assume skills not explicitly demonstrated in the conversation, or rely on external knowledge about typical candidates or information from the resume/JD *unless it was specifically discussed* in the interview. Refer implicitly or explicitly to specific parts of the conversation when forming strengths, weaknesses, and the summary.
2.  **Strict Behavioral and Tone Consideration:** Evaluate the candidate's tone, clarity, and professionalism as observed *in the transcript*. If responses are irrelevant, off-topic, evasive, or display a negative/unprofessional tone *within the conversation*, this *must* negatively impact the relevant scores (especially Communication Skills) and be mentioned as an area for improvement or in the summary.
3.  **Strict Scoring Based on Demonstrated Evidence:** Scores *must* reflect the level of competency *demonstrated during the conversation*. If the conversation does not provide evidence of the candidate meeting specific job requirements (even if listed on the resume/JD), the score should reflect that lack of demonstrated evidence within the 50-100 range. Avoid giving generally high scores if the conversation doesn't support it. A score of 70% means the candidate met basic expectations *as demonstrated in the specific interactions recorded*.
4.  **JSON Structure Adherence:** The output **must** be a single JSON object conforming *exactly* to the structure specified in the example below. No extra text, explanations, dialogues, or deviations are allowed outside the JSON structure.
5.  **Evaluation Criteria & Realism:** Evaluate based on demonstrated **technical knowledge, problem-solving abilities, and communication skills** *as observed and documented in the conversation transcript*. Be **objective and critical**. Do not inflate scores; provide a fair assessment reflecting the actual performance *witnessed* in the dialogue.
6.  **Scoring:**
    * Assign percentage scores for `technical_knowledge`, `problem_solving`, and `communication_skills`. Each score **must be an integer between 50 and 100** (inclusive).
    * **Be critical within this range**: A score of 70 indicates meeting basic expectations *demonstrated in the conversation*. Scores significantly higher require *clear, specific evidence of strong performance during the interview*. Scores between 50-69 should reflect observable weaknesses or significant gaps *in the conversation*.
    * Calculate the `overall_score` as the simple arithmetic mean (average) of the three skill scores (`technical_knowledge`, `problem_solving`, `communication_skills`), rounded to the nearest whole number. Present this score as a string: `"score / 100"`.
7.  **Overall Score Description Mapping:** Map the calculated numerical `overall_score` (the number before `/ 100`) to the following descriptions *exactly*:
    * **50-69**: "Below average performance, meeting minimal expectations demonstrated but requiring considerable improvement based on the conversation."
    * **70-84**: "Competent performance, meeting expectations demonstrated in the conversation, with room for improvement in specific areas identified."
    * **85-94**: "Strong performance, exceeding expectations based on clear evidence in the conversation, with only minor gaps noted."
    * **95-100**: "Exceptional performance, significantly exceeding expectations based on conversation evidence and appearing ideal for the role's requirements discussed."
8.  **Strengths & Areas for Improvement:** List specific, concrete points *directly observed during the conversation*. Vague compliments ("good communication") or criticisms ("lacked technical skills") are insufficient. Link these points to specific questions asked, answers given, or behavioral observations from the transcript (e.g., "Clearly explained [Concept X] when asked about Y," "Struggled to structure the answer to the problem-solving scenario involving Z," "Interrupted the interviewer multiple times during the discussion on [Topic]").
9.  **Summary & Closing Note:** Summarize the key observations *from the conversation*, justifying the overall assessment and scores. The closing note should realistically reflect the candidate's performance *in this specific interview* and their potential suitability based *only* on that interaction.
10. **Irrelevant Interview Response Handling:** If the candidate's responses *during the interview* are consistently irrelevant, nonsensical, or completely unrelated to the questions asked, making a standard evaluation impossible, return *only* the following JSON object:
    ```json
    {
      "error": "Candidate responses were largely irrelevant or incoherent, preventing a meaningful evaluation based on the interview conversation."
    }
    ```

**Required JSON Output Format Example:**

```json
{
  "interview_results": {
    "overall_score": {
      "score": "70 / 100",
      "description": "Competent performance, meeting expectations demonstrated in the conversation, with room for improvement in specific areas identified."
    },
    "strengths": [
      "Clearly articulated understanding of [Specific Concept mentioned in interview] when asked about [Related Question].",
      "Provided a relevant example from past experience (as discussed in the interview) for [Specific Skill].",
      "Maintained a professional and clear tone throughout the conversation, addressing questions directly."
    ],
    "areas_for_improvement": [
      "Struggled to provide a detailed step-by-step approach when asked the problem-solving question about [Specific Scenario discussed].",
      "Responses regarding [Specific Technical Area mentioned in conversation] lacked depth beyond a surface-level explanation.",
      "Could be more concise in explanations, particularly during the discussion on [Specific Topic from transcript]."
    ],
    "skill_evaluations": {
      "technical_knowledge": "75",
      "problem_solving": "65",
      "communication_skills": "70"
    },
    "summary": "Based *strictly* on the conversation, the candidate demonstrated foundational knowledge in [Area X discussed] but showed limitations in articulating complex problem-solving steps and providing technical depth in [Area Y discussed]. Communication was generally clear but occasionally lacked conciseness. Overall, a competent performance based on the dialogue.",
    "closing_note": "The candidate meets baseline expectations (70/100) based on this interview conversation. Further development in problem-solving articulation and specific technical areas discussed would be beneficial."
  }
}
"""

        evaluation_response = await self.conversation.ainvoke({"text": evaluation_prompt})
        evaluation_text = evaluation_response["text"]

        return evaluation_text
    
def generate_lip_sync(audio_file, output_file=r"results\lipsync.json"):
    # Ensure the paths are absolute
    rhubarb_path = r'Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe'
    command = [rhubarb_path,'-f','json',audio_file, '-o', output_file,'-r','phonetic']
    
    # Run the command
    result = subprocess.run(command, capture_output=True, text=True)
    
    # Print the output and error messages for debugging
    print("STDOUT:", result.stdout)
    print("STDERR:", result.stderr)


def convert_to_ogg(mp3_filename, ogg_filename=r"results\text_to_speech.ogg"):
    try:
        audio = AudioSegment.from_file(mp3_filename, format="mp3")
        audio.export(ogg_filename, format="ogg")
        return ogg_filename
    except FileNotFoundError as e:
        print("\n" + "="*40)
        print("ERROR: FFmpeg is missing!")
        print("PyDub requires FFmpeg to be installed and in your PATH.")
        print("Please install FFmpeg: https://ffmpeg.org/download.html")
        print("Or use: winget install ffmpeg")
        print("="*40 + "\n")
        raise e


async def text_to_mp3(text: str, filename=r"results\text_to_speech.mp3"):
    communicate = edge_tts.Communicate(text, "en-US-JennyNeural")
    await communicate.save(filename)
    return filename

def extract_resultjson(response, output_file=r"results\interview_results.json"):
    match=None
    if re.search(r'```json\s+(.*?)```', response, re.DOTALL):
        match=re.search(r'```json\s+(.*?)```', response, re.DOTALL)
    elif re.search(r"\{(.*)\}", response, re.DOTALL):
        match=re.search(r"\{(.*)\}", response, re.DOTALL)
    elif re.search(r"```[\s\S]*?```", response, re.DOTALL):
       match=re.search(r"```[\s\S]*?```", response, re.DOTALL)
       
    if match:
        json_block = match.group(1).strip()  # Extract and clean the JSON code block
        try:
            # Convert the extracted JSON block to a Python dictionary
            json_data = json.loads(json_block)
            
            # Save the JSON data to a file
            with open(output_file, "w") as json_file:
                json.dump(json_data, json_file, indent=4)
            
            print(f"JSON data successfully saved to {output_file}")
            return json_data
        except json.JSONDecodeError as e:
            print("Error decoding JSON:", e)
    else:
        print("No JSON code block found in the response.")

def format_conversation(conversation_data):
    return  [{msg.sender: msg.text} for msg in conversation_data]


# Instantiate the processor
processor = LanguageModelProcessor()

@app.post("/upload_resume/")
async def upload_resume(resume_file: UploadFile = File(...), job_description: str = Form(...), difficulty_level: str = Form(...)):
    resume_text = processor.extract_text_from_pdf(resume_file.file)
    processor.create_system_prompt(resume_text, job_description, difficulty_level)
    ai_start = await processor.process_user_message("Hello, I am ready for the interview.")
    mp3_filename = await text_to_mp3(ai_start)
    ogg_filename = convert_to_ogg(mp3_filename)
    generate_lip_sync(ogg_filename)

    return JSONResponse(content={"message": "System prompt created! AI interview started.", "ai_start": ai_start})
@app.get("/get_audio/",responses={"200": {"content": {"audio/mp3": {"example":{ "value": "binary audio data"}}}}})
async def get_audio():
    audio_path = r"results\text_to_speech.mp3"  # replace with your audio file path
    if os.path.exists(audio_path):
        return FileResponse(
            audio_path,
            media_type="audio/mpeg",
            filename=audio_path,
            
        )
    return {"error": "File generation failed"}

@app.get("/get_lypsync/", responses={"200": {"content": {"application/json": {"example":{ "value": "binary audio data"}}}}})
async def get_lypsync():
    lypsyncfile = r"results\lipsync.json"  # replace with your zip file path
    if os.path.exists(lypsyncfile):
        return FileResponse(
            lypsyncfile,
            media_type="application/json",
            filename=lypsyncfile
    )
    return {"error": "File generation failed"}


@app.post("/user_input/")
async def user_input(user_message: str = Form(...)):
    response = await processor.process_user_message(user_message) 
    
    # Convert the response to speech
    
    mp3_filename = await text_to_mp3(response)
    ogg_filename = convert_to_ogg(mp3_filename)
    generate_lip_sync(ogg_filename)

    return JSONResponse(content={"bot_response": response})

@app.post("/end_interview/",responses={"200": {"content": {"application/json": {"example":{ "value": "binary audio data"}}}}})
async def end_interview(payload: ConversationPayload):
    print("conversation:",payload.conversation)
    formatted = format_conversation(payload.conversation)
    interview_data=json.dumps(formatted, indent=2)
    evaluation = await processor.generate_interview_evaluation(interview_data)
    print("rawevaluation::",evaluation)
    Interview_evaluation_results=extract_resultjson(evaluation)
    print("Interview_evaluation_results::",Interview_evaluation_results)
    evaluationresults_path = r"results\interview_results.json"  # replace with your zip file path
    if os.path.exists(evaluationresults_path):
        return FileResponse(
            evaluationresults_path,
            media_type="application/json",
            filename=evaluationresults_path
    )
    return {"error": "File generation failed"}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# trigger reload
