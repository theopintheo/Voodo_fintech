import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

HF_API_KEY = os.environ.get("HUGGINGFACE_API_KEY", "")

# Initialize the OpenAI-compatible client for Hugging Face
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_API_KEY,
) if HF_API_KEY else None

MODEL = "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai"

class LLMCoach:
    @staticmethod
    def get_coach_advice(income, expenses, score, grade, language="English", personality="Saver", chat_history=None, user_message=None):
        if chat_history is None:
            chat_history = []
        
        system_prompt = f"""
        You are a financial advisor for young Indian earners (college students, interns, fresh graduates).
        The user is from India and categorized as a '{personality}'.
        Current language: {language}.
        
        Financial Data:
        - Monthly Income: ₹{income}
        - Health Score: {score}/100
        - Grade: {grade}
        - Expenses: {expenses}
        
        Rules:
        1. Keep the tone helpful, empathetic, and educational.
        2. Use conversational, simple {language}.
        3. Analyze unhealthy habits and suggest specific improvements.
        4. Provide a simple monthly savings plan when asked.
        5. Answer the user's specific question if they ask one.
        """
        
        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        
        # Use the actual user message if provided, otherwise use default
        if user_message:
            messages.append({"role": "user", "content": user_message})
        else:
            messages.append({"role": "user", "content": "Based on my data, please analyze my spending and give me advice."})
        
        fallback_response = f"""
Hello! Since you're categorized as a {personality} and your health score is {score}/100, let's look at your monthly pattern:

1. **UPI & Impulse Spending**: You mentioned {language} is your preferred language. Try tracking all small UPI scans—they add up fast!
2. **Hostel/Rent & Utilities**: Make sure your essential bills aren't crossing 50% of your ₹{income} income.
3. **Emergency Fund**: As a young earner in India, keep at least 3 months of expenses stashed in a high-yield liquid mutual fund or FD before taking on new EMIs.

Let me know if you'd like a detailed savings roadmap for your next goal!
"""
        
        if not client:
            return fallback_response
        
        try:
            completion = client.chat.completions.create(
                model=MODEL,
                messages=messages,
                max_tokens=512,
                temperature=0.7,
            )
            
            if completion.choices and len(completion.choices) > 0:
                return completion.choices[0].message.content.strip()
            return fallback_response
        except Exception as e:
            print(f"LLM Error: {e}")
            return fallback_response

    @staticmethod
    def get_budget_advice(prompt):
        """Get personalized budget recommendations from Mistral-7B."""
        fallback = [
            "Review categories exceeding 90% of their budget and set stricter weekly limits.",
            "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
            "Track small daily expenses — they add up to thousands monthly.",
            "Automate savings by transferring a fixed amount on payday."
        ]
        
        if not client:
            return fallback
        
        try:
            completion = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "You are a concise Indian financial advisor. Give practical money-saving tips."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.7,
            )
            
            if completion.choices and len(completion.choices) > 0:
                response = completion.choices[0].message.content.strip()
                # Try to extract tips - split by numbered items or newlines
                import re
                tips = re.split(r'\d+[\.\)]\s*', response)
                tips = [t.strip().strip('-•').strip() for t in tips if t.strip() and len(t.strip()) > 10]
                if len(tips) >= 4:
                    return tips[:4]
                elif len(tips) > 0:
                    return tips + fallback[len(tips):]
                return fallback
            return fallback
        except Exception as e:
            print(f"Budget Advice LLM Error: {e}")
            return fallback
