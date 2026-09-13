import type { Metadata } from "next";

const PAGE_URL = "https://app.tripdoc.net/about";

export const metadata: Metadata = {
  title: {
    absolute: "About TripDoc | Our Purpose and Verification Standards",
  },
  description:
    "Learn who operates TripDoc, how we assess global opportunities, what verification means and how to report information that needs correcting.",
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: "About TripDoc",
    description:
      "Our purpose, verification standards and approach to helping people explore global opportunities.",
    url: PAGE_URL,
    siteName: "TripDoc",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About TripDoc",
    description:
      "Meet the platform and understand our verification standards, limitations and corrections process.",
  },
};

const paragraphStyle = {
  color: "#444",
  lineHeight: 1.8,
  fontSize: 16,
};

const headingStyle = {
  fontSize: 24,
  fontWeight: 700,
  marginTop: 32,
  marginBottom: 12,
};

const listStyle = {
  color: "#444",
  lineHeight: 1.9,
  paddingLeft: 22,
};

const linkStyle = {
  color: "#0759b5",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export default function AboutPage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "32px 20px 48px",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 16,
        }}
      >
        About TripDoc
      </h1>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "18px 20px",
          background: "#fafafa",
          marginBottom: 22,
        }}
      >
        <p style={{ ...paragraphStyle, margin: 0 }}>
          TripDoc helps students, graduates and professionals explore
          scholarships, internships, fellowships, research positions,
          volunteering and other global opportunities. Our purpose is
          to make the information easier to understand and check
          before applying.
        </p>
      </div>

      <h2 style={headingStyle}>Who is behind TripDoc?</h2>

      <p style={paragraphStyle}>
        TripDoc is operated by TRIPDOC TECHNOLOGIES LIMITED.
        The platform was founded by Ayodele Moses Omolanke to help
        people navigate international opportunities with clearer
        information and practical digital tools.
      </p>

      <p style={paragraphStyle}>
        We serve people exploring opportunities across borders,
        including applicants in Nigeria, Uganda and other countries.
        Eligibility depends on each programme and the applicant’s
        circumstances.
      </p>

      <h2 style={headingStyle}>What you can do on TripDoc</h2>

      <ul style={listStyle}>
        <li>
          Explore opportunities by country, category and funding.
        </li>
        <li>
          Read summaries of eligibility, application steps, deadlines
          and funding details.
        </li>
        <li>
          Follow source links to check information with the
          responsible institution or organisation.
        </li>
        <li>
          Explore employer and vacancy information through Hiring
          Companies.
        </li>
        <li>
          Use Volunteer Match as a starting point for assessing
          volunteer routes that may fit your profile.
        </li>
      </ul>

      <p style={paragraphStyle}>
        <a href="/programs" style={linkStyle}>
          Browse opportunities
        </a>
        {" · "}
        <a href="/hiring-companies" style={linkStyle}>
          Explore Hiring Companies
        </a>
        {" · "}
        <a href="/volunteer-match" style={linkStyle}>
          Try Volunteer Match
        </a>
      </p>

      <h2 style={headingStyle}>Our verification standards</h2>

      <p style={paragraphStyle}>
        Our standard is to base opportunity information on official
        sources, such as the responsible university, employer,
        government body or programme organiser. These are the
        questions that guide our checks:
      </p>

      <ul style={listStyle}>
        <li>
          <strong>Source:</strong> Is there an official announcement
          or application page supporting the opportunity?
        </li>
        <li>
          <strong>Eligibility:</strong> What nationality, residence,
          education, experience or language restrictions are stated?
        </li>
        <li>
          <strong>Funding:</strong> What is covered, what is excluded
          and what might the applicant need to pay?
        </li>
        <li>
          <strong>Deadline:</strong> Does the closing date vary by
          country, programme or application route?
        </li>
        <li>
          <strong>Application:</strong> Where should the applicant
          apply, and which documents are requested?
        </li>
        <li>
          <strong>Sponsorship:</strong> Does the specific vacancy
          explicitly support the sponsorship claim?
        </li>
      </ul>

      <p style={paragraphStyle}>
        Unconfirmed information should be identified as unconfirmed.
        A company’s ability to sponsor workers is not, by itself,
        evidence that it offers sponsorship for every vacancy.
        Conflicting source statements need clarification before
        applicants rely on them.
      </p>

      <h2 style={headingStyle}>What “verified” means</h2>

      <p style={paragraphStyle}>
        A verification label refers to information checked against
        the sources available at the time of review. It is not an
        endorsement by the institution concerned, a promise that
        places remain available or a guarantee of a successful
        application.
      </p>

      <p style={paragraphStyle}>
        A publication date is not necessarily a verification date.
        Where a last-checked date is displayed, read it together
        with the source and the scope of the check.
      </p>

      <p style={paragraphStyle}>
        We do not claim to monitor every listing continuously.
        Programmes can change their requirements, funding or
        availability after publication. Always check the official
        application page before submitting documents, paying fees
        or arranging travel.
      </p>

      <h2 style={headingStyle}>Matching tools and guidance</h2>

      <p style={paragraphStyle}>
        Volunteer Match provides a rules-based assessment to help
        you identify routes worth investigating. A result is not
        confirmation that a placement is open or that an organisation
        will accept you.
      </p>

      <p style={paragraphStyle}>
        Information or guidance from TripDoc does not guarantee
        admission, employment, funding, placement or visa approval.
        Selection and immigration decisions remain with the
        responsible organisations and authorities.
      </p>

      <h2 style={headingStyle}>Report an error or outdated listing</h2>

      <p style={paragraphStyle}>
        If you find information that appears incorrect or outdated,
        please send us:
      </p>

      <ul style={listStyle}>
        <li>The TripDoc page address.</li>
        <li>The statement or detail that needs attention.</li>
        <li>An official source supporting the correction, if available.</li>
      </ul>

      <p style={paragraphStyle}>
        Send correction reports to{" "}
        <a href="mailto:info@tripdoc.net" style={linkStyle}>
          info@tripdoc.net
        </a>
        . Please do not include passports, financial records or
        other sensitive application documents in an error report.
      </p>

      <h2 style={headingStyle}>Contact and partnerships</h2>

      <p style={paragraphStyle}>
        For general enquiries:{" "}
        <a href="mailto:info@tripdoc.net" style={linkStyle}>
          info@tripdoc.net
        </a>
        .
      </p>

      <p style={paragraphStyle}>
        For institutional or business collaboration:{" "}
        <a href="mailto:partnerships@tripdoc.net" style={linkStyle}>
          partnerships@tripdoc.net
        </a>
        .
      </p>

      <p style={paragraphStyle}>
        <a href="/contact" style={linkStyle}>
          Contact page
        </a>
      </p>
    </main>
  );
}