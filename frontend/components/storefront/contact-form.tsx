"use client";

import { ArrowRight, Mail } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useState,
} from "react";

const INVALID_FORM_MESSAGE = "Please complete both fields before continuing.";
const EMAIL_APP_MESSAGE =
  "Opening your email app with the message ready to review.";

type ContactFormProps = {
  contactEmail: string;
};

export function ContactForm({ contactEmail }: ContactFormProps) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus(INVALID_FORM_MESSAGE);
      return;
    }

    const subject = encodeURIComponent(`Farm inquiry from ${name.trim()}`);
    const body = encodeURIComponent(message.trim());
    setStatus(EMAIL_APP_MESSAGE);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  };

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setStatus("");
  };

  const handleMessageChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
    setStatus("");
  };

  return (
    <section className="border border-[#d4cbb8] bg-[#fdfbf5] p-6 shadow-[0_20px_50px_rgba(54,48,35,0.08)] sm:p-8">
      <div className="flex items-center gap-3 border-b border-[#ddd5c5] pb-5">
        <span className="grid size-10 place-items-center rounded-full bg-[#e3ebdc] text-[#173b24]">
          <Mail aria-hidden="true" size={19} />
        </span>
        <div>
          <h3 className="text-xl font-black text-[#18331f]">Write to us</h3>
          <p className="mt-1 text-sm text-[#697066]">
            Your email app opens when you continue.
          </p>
        </div>
      </div>
      <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="form-label" htmlFor="contact-name">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={handleNameChange}
            className="form-field"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="form-label" htmlFor="contact-message">
            How can we help?
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            value={message}
            onChange={handleMessageChange}
            className="form-field min-h-32 resize-y py-3"
            placeholder="Ask about availability, pickup, or subscriptions"
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p
            className="min-h-5 text-xs font-semibold text-[#6b7168]"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
          <button type="submit" className="button-primary shrink-0">
            Continue to email <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
