import os
import json
import re
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("helpdesk.llm")

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
# Default Groq Llama 3 models: llama3-8b-8192 or llama3-70b-8192
MODEL_NAME = "llama3-8b-8192"

client = None
if GROQ_API_KEY and not GROQ_API_KEY.startswith("your_") and not GROQ_API_KEY.startswith("gsk_free_tier_"):
    try:
        client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq Client initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing Groq client: {e}")

# Supported Categories
CATEGORIES = [
    "Hardware Issue", "Software Issue", "Network Issue", "Security Issue",
    "Login/Authentication", "HR/Payroll", "Cloud/Server", "Email Issue", "Database Issue"
]

# Supported Priorities
PRIORITIES = ["Low", "Medium", "High", "Critical"]

# System prompt with few-shot examples for structuring
SYSTEM_PROMPT = """You are an expert Helpdesk AI agent. Your job is to analyze user complaints, detect the language, translate it to English if necessary, categorize, prioritize, summarize, and route it to the appropriate department.

Assign priority based on business impact, emotional tone, and scale:
- Critical: Outages, production server down, security breaches, payroll blockers affecting everyone.
- High: Major application features broken, single-user payroll crashes, VPN blocker.
- Medium: Standard software bugs, login problems (not lockout), hardware replacements.
- Low: Informational queries, password reminders, UI adjustments.

You MUST return a strict JSON output matching this schema:
{
  "detected_language": "English, Hindi, Kannada, etc.",
  "original_text": "original user complaint",
  "translated_text": "english translation (if not english, else matches original)",
  "title": "Short descriptive ticket title",
  "summary": "Short technical summary of the problem (1-2 sentences)",
  "category": "One of: Hardware Issue, Software Issue, Network Issue, Security Issue, Login/Authentication, HR/Payroll, Cloud/Server, Email Issue, Database Issue",
  "subcategory": "specific component name, e.g., VPN Access, BIOS, MongoDB query, Payroll Portal",
  "priority": "One of: Low, Medium, High, Critical",
  "department": "One of: IT Support, HR & Payroll, Cybersecurity, Database Admin, Network Operations, Cloud Infrastructure, Hardware Operations, Software Engineering",
  "tags": ["3-5 relevant keywords"],
  "reasoning": "Explain why this category, priority, and department were assigned based on impact, scale, and emotional urgency.",
  "suggested_solution": "Brief technical solution or troubleshooting steps for the admin/user",
  "sentiment": "One of: Positive, Neutral, Negative",
  "escalation_predicted": true/false (true if critical outage, client meeting blocker, or high frustration),
  "sla_risk_level": "One of: Low, Medium, High"
}

---
Few-Shot Example 1:
User: "मेरा वीपीएन कनेक्ट नहीं हो रहा है, काम रुक गया है"
Output:
{
  "detected_language": "Hindi",
  "original_text": "मेरा वीपीएन कनेक्ट नहीं हो रहा है, काम रुक गया है",
  "translated_text": "My VPN is not connecting, my work is stopped.",
  "title": "VPN Connection Failure - User Blocked",
  "summary": "User is unable to establish a VPN connection, preventing them from accessing corporate network resources.",
  "category": "Network Issue",
  "subcategory": "VPN Access",
  "priority": "High",
  "department": "Network Operations",
  "tags": ["VPN", "Hindi", "Connectivity", "Remote Work"],
  "reasoning": "Priority is High because remote work is completely blocked due to VPN connection failure.",
  "suggested_solution": "Check user VPN credentials, verify network gateway routing, or ask user to restart local router and try TCP protocol.",
  "sentiment": "Negative",
  "escalation_predicted": false,
  "sla_risk_level": "Medium"
}

Ensure the output is valid JSON and contains only the JSON object. Do not include markdown code fences or any other conversational text.
"""

def heuristic_parse_ticket(text: str) -> dict:
    """
    Fallback parser when Groq is unavailable. Uses simple NLP heuristics to classify and prioritize.
    """
    logger.info("Running heuristic fallback ticket analyzer.")
    lower_text = text.lower()
    
    # 1. Language Detection & Translation (Heuristics)
    detected_lang = "English"
    translated = text
    
    # Check simple Kannada/Hindi character blocks
    hindi_words = ["मेरा", "है", "नहीं", "हो", "काम", "रुक", "वीपीएन", "पासवर्ड", "लॉगिन", "सर्वर"]
    kannada_words = ["ನನ್ನ", "ಕೆಲಸ", "ಆಗುತ್ತಿಲ್ಲ", "ಸಮಸ್ಯೆ", "ಲಾಗಿನ್", "ಸರ್ವರ್", "ವಿಪಿಎನ್"]
    
    if any(word in text for word in hindi_words):
        detected_lang = "Hindi"
        # Mock translations for common phrases
        if "वीपीएन" in text:
            translated = "My VPN is not connecting, work is stopped."
        elif "पासवर्ड" in text:
            translated = "I forgot my password, please help reset it."
        elif "सर्वर" in text:
            translated = "Production server is down, everything crashed."
        else:
            translated = "Translation of: " + text
    elif any(word in text for word in kannada_words):
        detected_lang = "Kannada"
        if "ವಿಪಿಎನ್" in text:
            translated = "My VPN is not connecting, work is stopped."
        elif "ಲಾಗಿನ್" in text:
            translated = "Login issue on the system."
        elif "ಸರ್ವರ್" in text:
            translated = "Server down outage."
        else:
            translated = "Translation of: " + text

    lower_trans = translated.lower()
    
    # 2. Categorization & Routing Heuristics
    category = "Software Issue"
    department = "Software Engineering"
    subcategory = "Application Crash"
    
    if any(w in lower_trans for w in ["database", "db", "mongo", "postgres", "sql", "query"]):
        category = "Database Issue"
        department = "Database Admin"
        subcategory = "Database Query Timeout"
    elif any(w in lower_trans for w in ["vpn", "network", "wifi", "wi-fi", "router", "dns", "internet"]):
        category = "Network Issue"
        department = "Network Operations"
        subcategory = "VPN Connection"
    elif any(w in lower_trans for w in ["login", "password", "sign in", "auth", "lockout", "mfa"]):
        category = "Login/Authentication"
        department = "IT Support"
        subcategory = "User Authentication"
    elif any(w in lower_trans for w in ["payroll", "salary", "hr", "slip", "payslip", "pf", "provident"]):
        category = "HR/Payroll"
        department = "HR & Payroll"
        subcategory = "Payroll Software"
    elif any(w in lower_trans for w in ["server", "cloud", "aws", "gcp", "docker", "instance", "deployment"]):
        category = "Cloud/Server"
        department = "Cloud Infrastructure"
        subcategory = "Server VM Instance"
    elif any(w in lower_trans for w in ["laptop", "hardware", "monitor", "keyboard", "mouse", "charger"]):
        category = "Hardware Issue"
        department = "Hardware Operations"
        subcategory = "Laptop Accessories"
    elif any(w in lower_trans for w in ["security", "virus", "hacked", "phishing", "leak", "firewall"]):
        category = "Security Issue"
        department = "Cybersecurity"
        subcategory = "Security Threat Alert"
    elif any(w in lower_trans for w in ["email", "outlook", "gmail", "mailbox", "smtp"]):
        category = "Email Issue"
        department = "IT Support"
        subcategory = "Mail Delivery"

    # 3. Priority Heuristics
    priority = "Medium"
    if any(w in lower_trans for w in ["production down", "down", "outage", "crashed", "broken for all", "everyone", "critical", "incident"]):
        priority = "Critical"
    elif any(w in lower_trans for w in ["meeting", "presentation", "blocked", "cannot work", "urgent", "customer", "client"]):
        priority = "High"
    elif any(w in lower_trans for w in ["question", "clarification", "how to", "reminder", "ui"]):
        priority = "Low"

    # 4. Sentiment & Escalation
    sentiment = "Neutral"
    if any(w in lower_trans for w in ["crashed", "broken", "frustrated", "awful", "terrible", "stuck", "down"]):
        sentiment = "Negative"
    elif any(w in lower_trans for w in ["thanks", "good", "great", "please"]):
        sentiment = "Positive"
        
    escalation = False
    if priority in ["Critical", "High"] or sentiment == "Negative":
        escalation = True
        
    sla = "Low"
    if priority == "Critical":
        sla = "High"
    elif priority == "High":
        sla = "Medium"

    # 5. Summary & Solutions
    words = translated.split()
    summary = " ".join(words[:12]) + "..." if len(words) > 12 else translated
    title = f"{category} - {subcategory}"
    
    solutions = {
        "Database Issue": "Check database connection pool sizes, check for locks, verify queries are using proper indexes.",
        "Network Issue": "Verify VPN server credentials, flush local DNS, restart local router, check server gateway status.",
        "Login/Authentication": "Check Active Directory lockout status, reset password, verify authenticator token synchrony.",
        "HR/Payroll": "Verify system payroll cycles, check bank integration status, or re-push payslip batch.",
        "Cloud/Server": "Restart VM instance, check CPU/RAM utilization logs, scale instances, check firewall security groups.",
        "Hardware Issue": "Schedule hardware replacement, check battery status, test cable integrity.",
        "Security Issue": "Isolate system from network, run malware scan, rotate compromised credentials.",
        "Email Issue": "Verify Outlook sync status, check SMTP server routing logs, flush local cache.",
        "Software Issue": "Update application version, clear web browser cache, reinstall software client."
    }
    
    suggested_solution = solutions.get(category, "Review logs, restart application, or escalate to relevant support engineer.")

    return {
        "detected_language": detected_lang,
        "original_text": text,
        "translated_text": translated,
        "title": title,
        "summary": summary,
        "category": category,
        "subcategory": subcategory,
        "priority": priority,
        "department": department,
        "tags": [category.replace(" ", ""), subcategory.replace(" ", ""), detected_lang],
        "reasoning": f"Priority marked {priority} and categorized as {category} because description mentions terms related to '{subcategory}' and suggests a '{priority}' status.",
        "suggested_solution": suggested_solution,
        "sentiment": sentiment,
        "escalation_predicted": escalation,
        "sla_risk_level": sla
    }

async def analyze_ticket_complaint(text: str) -> dict:
    """
    Analyzes ticket description using Groq LLM with a fallback heuristic model.
    """
    if not client:
        return heuristic_parse_ticket(text)

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this user complaint: '{text}'"}
            ],
            model=MODEL_NAME,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Safe JSON parse
        data = json.loads(response_content)
        
        # Enforce schemas checks
        required_keys = ["title", "summary", "category", "priority", "department", "reasoning", "suggested_solution"]
        for key in required_keys:
            if key not in data:
                # Fallback to heuristic fill if missing keys
                fallback_data = heuristic_parse_ticket(text)
                data[key] = fallback_data[key]
                
        # Handle sentiment, escalation, sla defaults if missing
        if "sentiment" not in data:
            data["sentiment"] = "Neutral"
        if "escalation_predicted" not in data:
            data["escalation_predicted"] = False
        if "sla_risk_level" not in data:
            data["sla_risk_level"] = "Low"
            
        return data
        
    except Exception as e:
        logger.error(f"Groq API ticket analysis failed: {e}. Switching to heuristic fallback.")
        return heuristic_parse_ticket(text)
