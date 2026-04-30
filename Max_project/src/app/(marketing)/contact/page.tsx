import { MarketingHeader } from "@/components/layout/marketing-header";

export default function ContactPage() {
  return (
    <>
      <MarketingHeader />
      <main className="page-shell">
        <section className="panel">
          <p className="eyebrow">Contact</p>
          <h1>Product feedback, roadmap requests, and partnership conversations.</h1>
          <p className="lede">
            In a production setup this page would submit into a backend inbox, CRM, or support pipeline. Right now it exists as the structured product surface for that future path.
          </p>
          <form className="wizard-fields" action="/api/contact" method="post">
            <div className="field-group">
              <label htmlFor="name">Name</label>
              <input id="name" name="name" className="text-input" />
            </div>
            <div className="field-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" className="text-input" />
            </div>
            <div className="field-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" className="text-area" rows={5} />
            </div>
            <div className="controls">
              <button type="submit" className="primary">
                Send message
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
