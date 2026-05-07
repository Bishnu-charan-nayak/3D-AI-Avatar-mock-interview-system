import speech_recognition as sr

def transcribe_audio_file(audio_file_path):
    """
    Transcribes an audio file to text using the speech_recognition library.

    Args:
        audio_file_path (str): Path to the audio file.

    Returns:
        str: Transcribed text or an error message.
    """
    recognizer = sr.Recognizer()
    try:
        # Load the audio file
        with sr.AudioFile(audio_file_path) as source:
            print("Loading audio file...")
            audio_data = recognizer.record(source)
            print("Transcribing audio...")
            # Recognize speech using Google's Web Speech API
            text = recognizer.recognize_google(audio_data)
            return text
    except sr.UnknownValueError:
        return "Error: Could not understand audio."
    except sr.RequestError as e:
        return f"Error: Could not request results from the speech recognition service; {e}"
    except FileNotFoundError:
        return "Error: Audio file not found."
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    # Example usage
    audio_file = input("Enter the path to the audio file: ").strip()
    result = transcribe_audio_file(audio_file)
    print("\nTranscription Result:")
    print(result)
