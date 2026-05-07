import json
import re

# Sample response containing a JSON code block
response = """{
  "evaluation": ```json
{
  "interview_results": {
    "overall_score": {
      "description": "70 / 100",
      "scale": {
        "0-49": "Unsatisfactory performance with significant improvement required.",
        "50-69": "Below average performance, meeting minimal expectations but requiring considerable improvement.",
        "70-84": "Competent performance, meeting expectations with room for improvement in key areas.",
        "85-94": "Strong performance, exceeding expectations with minor gaps.",
        "95-100": "Exceptional performance, significantly exceeding expectations and ideal for the role."
      },
      "example": "85 / 100"
    },
    "strengths": {
      "description": "List the candidate's key strengths demonstrated during the interview.",
      "example": [
        "Enthusiastic about AI",
        "Demonstrates understanding of NLP and Generative AI"
      ]
    },
    "areas_for_improvement": {
      "description": "Highlight areas where the candidate could improve or focus on for growth.",
      "example": [
        "Needs to elaborate more on technical details",
        "Practice structuring responses more clearly"
      ]
    },
    "skill_evaluations": {
      "description": "Provide percentage evaluations for specific skills demonstrated by the candidate, with detailed scaling for interpretation.",       
      "scale": {
        "0-49%": "Poor performance requiring significant improvement.",
        "50-69%": "Below average performance needing development.",
        "70-84%": "Good performance meeting expectations with some areas for improvement.",
        "85-94%": "Strong performance exceeding expectations with minor gaps.",
        "95-100%": "Exceptional performance demonstrating excellence in the skill."
      },
      "fields": {
        "technical_knowledge": {
          "description": "Evaluate the candidate's technical knowledge as a percentage.",
          "example": "65%"
        },
        "problem_solving": {
          "description": "Evaluate the candidate's problem-solving skills as a percentage.",
          "example": "70%"
        },
        "communication_skills": {
          "description": "Evaluate the candidate's communication skills as a percentage.",
          "example": "60%"
        }
      }
    },
    "summary": {
      "description": "The candidate showed enthusiasm for AI and a basic understanding of NLP and Generative AI. However, they need to elaborate more on technical details and improve their structured communication.",
      "example": "The candidate demonstrated strong technical knowledge and excellent problem-solving skills. However, there is room for improvement in time management and leadership skills."
    },
    "closing_note": {
      "description": "Focusing on providing more detailed technical explanations and practicing clear communication will strengthen the candidate's profile.",
      "example": "We recommend focusing on improving time management and leadership skills to further enhance performance."
    }
  }
}
```
}"""

# Extract the JSON code block using a regular expression
match = re.search(r'```json\s+(.*?)```', response, re.DOTALL)
if match:
    json_block = match.group(1).strip()  # Extract and clean the JSON code block
    try:
        # Convert the extracted JSON block to a Python dictionary
        json_data = json.loads(json_block)
        print(json_data)

        # Print the extracted JSON object
        print("Extracted JSON Object:")
        print(json.dumps(json_data, indent=4))
    except json.JSONDecodeError as e:
        print("Error decoding JSON:", e)
else:
    print("No JSON code block found in the response.")
