import smtplib
from email.mime.text import MIMEText

from config import EMAIL_ADDRESS, EMAIL_PASSWORD, RESET_PASSWORD_BASE_URL, SMTP_PORT, SMTP_SERVER


def send_password_reset_email(to_email, reset_token):
    try:
        if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
            msg = "Email service is not configured. Set EMAIL_ADDRESS and EMAIL_PASSWORD in .env."
            print("Email sending failed:", msg)
            return False, msg

        reset_link = f"{RESET_PASSWORD_BASE_URL}/{reset_token}"

        subject = "Password Reset - Smart Governance"
        body = (
            "Hello,\n\n"
            "You requested a password reset.\n\n"
            "Click the link below to reset your password:\n"
            f"{reset_link}\n\n"
            "If you did not request this, ignore this email.\n\n"
            "Smart Governance System\n"
        )

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            server.send_message(msg)

        print("Password reset email sent successfully to:", to_email)
        return True, None

    except smtplib.SMTPAuthenticationError:
        msg = "SMTP authentication failed. Use a valid email address and app password."
        print("Email sending failed:", msg)
        return False, msg

    except Exception as e:
        msg = f"Email sending failed: {str(e)}"
        print(msg)
        return False, msg
