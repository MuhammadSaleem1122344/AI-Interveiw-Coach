from email.message import EmailMessage
import smtplib

from .config import settings


def send_password_reset_email(to_email: str, otp: str) -> None:
    message = EmailMessage()
    message["Subject"] = "Your Interview Coach password reset code"
    message["From"] = settings.gmail_from or settings.gmail_user
    message["To"] = to_email
    message.set_content(
        f"Your password reset code is {otp}. It expires in 10 minutes. "
        "If you did not request this, you can ignore this email."
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        server.starttls()
        server.login(settings.gmail_user, settings.gmail_app_password)
        server.send_message(message)