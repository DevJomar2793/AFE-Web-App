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
    <section className="border border-white/15 bg-[#fffdf7] p-6 text-[#18331f] shadow-[0_28px_70px_rgba(5,20,10,0.24)] sm:p-8 lg:p-10">
      <div className="flex items-start gap-4 border-b border-[#ddd5c5] pb-6">
        <span className="grid size-12 shrink-0 place-items-center bg-[#e3ebdc] text-[#173b24]">
          <Mail aria-hidden="true" size={21} />
        </span>
        <div>
          <p className="eyebrow">Email inquiry</p>
          <h3 className="mt-2 text-2xl font-black text-[#18331f]">
            Tell us what you need.
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#697066]">
            Both fields are required. You can review everything before sending.
          </p>
        </div>
      </div>

      <form className="mt-7 space-y-6" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="form-label" htmlFor="contact-name">
            Name <span className="text-[#a85620]">*</span>
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
            How can we help? <span className="text-[#a85620]">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            value={message}
            onChange={handleMessageChange}
            className="form-field min-h-40 resize-y py-3"
            placeholder="Tell us which products and quantities you need"
          />
        </div>

        <div className="border-t border-[#ddd5c5] pt-6">
          <p
            className="mb-4 min-h-5 text-sm font-semibold leading-5 text-[#6b7168]"
            role="status"
            aria-live="polite"
          >
            {status}
          </p>
          <button type="submit" className="button-primary w-full sm:w-auto">
            Continue to email <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>
      </form>
    </section>
  );
}
