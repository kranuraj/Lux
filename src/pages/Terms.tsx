import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

interface Section {
  title: string;
  paragraphs: string[];
}

const TERMS_SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By accessing or using LuxBoom (the \"Service\"), you agree to be bound by these Terms & Conditions, the Privacy Policy below, and any additional terms referenced herein. If you do not agree with any part of these terms, you must not use the Service.",
      "The Service is operated for learning and educational purposes only. It is not a registered investment adviser, stock broker, sub-broker, research analyst, or portfolio manager under any law of India, including the Securities and Exchange Board of India (SEBI) Act, 1992, and the SEBI (Research Analysts) Regulations, 2014.",
    ],
  },
  {
    title: "2. Nature of the Service — No Investment Advice",
    paragraphs: [
      "LuxBoom is a screening and educational tool that displays technical indicators and historical price data for equities listed on the National Stock Exchange of India (NSE). The signals, rankings, and figures shown are generated algorithmically and are provided solely for learning and information purposes.",
      "Nothing on the Service constitutes an offer, solicitation, recommendation, endorsement, or advice to buy, sell, or hold any security, nor a recommendation regarding the suitability or profitability of any investment. No content should be relied upon as investment, financial, legal, tax, or accounting advice.",
      "You are solely responsible for your own investment decisions. Always do your own research, verify any data independently, and consult a SEBI-registered investment adviser or other qualified professional before making any investment. Past performance, back-tested results, or technical patterns do not guarantee future results.",
    ],
  },
  {
    title: "3. Eligibility",
    paragraphs: [
      "The Service is available to individuals who are at least 18 years of age and can form legally binding contracts under applicable law. By creating an account, you represent that you meet these requirements and that all information you provide is accurate and current.",
      "The Service is intended for users in India and is governed by Indian law. If you access the Service from outside India, you do so at your own risk and are responsible for compliance with the laws of your jurisdiction.",
    ],
  },
  {
    title: "4. Accounts, Data & User Obligations",
    paragraphs: [
      "To use the Service you must sign in with your name and email address. You agree to provide accurate information and to keep it updated. You are responsible for safeguarding access to your account and for all activity that occurs under it. Notify us promptly of any unauthorized use.",
      "You agree not to misuse the Service — including attempting to access it through automated means beyond normal use, scraping data in a manner that disrupts the Service, or using it for any unlawful purpose.",
      "Your name and email are stored to operate your account and to measure usage of the Service (for example, the number of scans you run and the time you spend on the Service). We do not sell your personal information.",
    ],
  },
  {
    title: "5. Data Sources & Accuracy",
    paragraphs: [
      "Price and equity-list data shown in the Service is sourced from third-party providers (such as Yahoo Finance and public NSE listings). This data may be delayed, incomplete, or contain errors.",
      "The Service is provided \"as is\" and \"as available\". We do not warrant the accuracy, completeness, timeliness, or reliability of any data, indicator, or signal displayed. You agree that any reliance on the data is entirely at your own risk.",
    ],
  },
  {
    title: "6. Intellectual Property",
    paragraphs: [
      "The Service, including its software, design, text, graphics, and branding, is owned by or licensed to LuxBoom and is protected by applicable intellectual-property laws. You may not copy, modify, distribute, sell, or create derivative works from any part of the Service without prior written permission.",
    ],
  },
  {
    title: "7. No Warranty & Limitation of Liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.",
      "IN NO EVENT SHALL LUXBOOM, ITS OPERATORS, OR ITS SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF, OR INABILITY TO USE, THE SERVICE — INCLUDING ANY FINANCIAL LOSS INCURRED FROM INVESTMENT DECISIONS MADE IN CONNECTION WITH THE SERVICE.",
      "Without limiting the foregoing, our total aggregate liability to you shall not exceed the amount paid by you, if any, for access to the Service during the twelve (12) months preceding the claim.",
    ],
  },
  {
    title: "8. Indemnification",
    paragraphs: [
      "You agree to indemnify and hold harmless LuxBoom, its operators, employees, agents, and service providers from and against any claims, losses, damages, liabilities, and expenses (including reasonable legal fees) arising out of your use of the Service, your violation of these Terms, or your violation of any rights of a third party — including claims arising from investment decisions you make.",
    ],
  },
  {
    title: "9. Third-Party Links & Services",
    paragraphs: [
      "The Service may link to third-party websites and services, including TradingView, NSE, and Yahoo Finance. These links are provided for convenience only. We do not control and are not responsible for the content, accuracy, or privacy practices of any third-party website. Your use of third-party services is subject to their own terms and policies.",
    ],
  },
  {
    title: "10. Termination",
    paragraphs: [
      "We may suspend or terminate your access to the Service at any time, with or without cause or notice, including if you breach these Terms. You may stop using the Service at any time. Sections which by their nature should survive termination — including disclaimers, limitation of liability, and indemnification — shall survive.",
    ],
  },
  {
    title: "11. Changes to These Terms",
    paragraphs: [
      "We may update these Terms & Conditions and the Privacy Policy from time to time. Material changes will be reflected by an updated \"Last updated\" date on this page. Your continued use of the Service after changes are posted constitutes your acceptance of the revised terms. If you do not agree, you should stop using the Service.",
    ],
  },
  {
    title: "12. Governing Law & Jurisdiction",
    paragraphs: [
      "These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of India, and you consent to such jurisdiction.",
      "Nothing in these Terms limits any right you may have under mandatory consumer-protection or other applicable law that cannot be excluded.",
    ],
  },
  {
    title: "13. Contact",
    paragraphs: [
      "If you have any questions about these Terms, the Privacy Policy, or your personal data, you may contact us through the feedback options available on the Service.",
    ],
  },
];

const PRIVACY_SECTIONS: Section[] = [
  {
    title: "1. Information We Collect",
    paragraphs: [
      "Account information: your name and email address, provided when you sign in. This is used to create and identify your account and to personalize the Service (for example, a greeting and profile display).",
      "Usage information: login time and frequency, time spent using the Service, and the number of screening scans you run. This helps us understand how the Service is used and to keep it functioning.",
      "Device information: standard technical details such as browser type and device identifiers may be processed to deliver and secure the Service.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    paragraphs: [
      "We use your information to operate, maintain, personalize, and improve the Service; to authenticate you; to provide usage analytics to the Service owner; and to respond to your requests. We do not sell, rent, or trade your personal information to third parties.",
      "Aggregated and de-identified statistics (for example, total users or total scans) may be used without identifying any individual.",
    ],
  },
  {
    title: "3. Cookies & Local Storage",
    paragraphs: [
      "The Service uses browser local storage and session mechanisms to keep you signed in and to remember preferences you choose, such as the \"Remember me\" option, which stores your name and email on your own device so you do not have to re-enter them. You can clear this data at any time through your browser settings or by unticking \"Remember me\" when signing in.",
    ],
  },
  {
    title: "4. Service Providers",
    paragraphs: [
      "We use third-party providers to run the Service, including a hosted database and backend (Convex), an email delivery service to send your one-time sign-in codes, and public market-data sources (such as Yahoo Finance and NSE) to display prices. These providers process data only to the extent needed to provide their services and are bound by their own data-protection obligations.",
    ],
  },
  {
    title: "5. Data Retention & Your Rights",
    paragraphs: [
      "We retain your account information for as long as your account is active and as needed to provide the Service or comply with legal obligations. You may request access to, correction of, or deletion of your personal information by contacting us.",
    ],
  },
  {
    title: "6. Security",
    paragraphs: [
      "We take reasonable technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    title: "7. Children's Privacy",
    paragraphs: [
      "The Service is not directed to individuals under 18 years of age, and we do not knowingly collect personal information from children.",
    ],
  },
  {
    title: "8. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. The \"Last updated\" date on this page reflects the most recent revision, and your continued use of the Service after changes are posted constitutes acceptance of the revised policy.",
    ],
  },
];

const DISCLAIMER =
  "For learning purposes only — not a stock suggestion or investment advice. LuxBoom is not registered with SEBI or any regulatory body. Always do your own research and consult a SEBI-registered advisor before investing.";

function SectionBlock({ section }: { section: Section }) {
  return (
    <section className="border-t border-border py-12 first:border-t-0">
      <h2 className="text-sm font-semibold tracking-tight">{section.title}</h2>
      {section.paragraphs.map((p, i) => (
        <p
          key={i}
          className="mt-5 text-[13px] leading-6 text-muted-foreground"
        >
          {p}
        </p>
      ))}
    </section>
  );
}

export default function Terms() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="min-h-screen bg-background text-foreground"
    >
      {/* Same centered max-width column as the screener */}
      <div className="mx-auto w-full max-w-[800px] px-4 py-6 sm:px-8 sm:py-10">
        {/* Header */}
        <header className="border-b border-border pb-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate("/auth")}
              className="h-7 shrink-0 px-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </Button>
            <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
              LuxBoom · Legal
            </p>
          </div>
          <h1 className="mt-1.5 text-3xl font-light tracking-tight sm:text-4xl">
            Terms &amp; Privacy
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70">
            Last updated · August 2026
          </p>
        </header>

        {/* Disclaimer banner */}
        <div className="mt-7 rounded-lg border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <p className="text-[12px] leading-5 text-foreground/90">
              {DISCLAIMER}
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-4">
          <div className="flex items-center gap-2 py-8">
            <FileText className="size-4 text-muted-foreground" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Terms &amp; Conditions
            </h2>
          </div>
          {TERMS_SECTIONS.map((section) => (
            <SectionBlock key={section.title} section={section} />
          ))}
        </div>

        {/* Privacy */}
        <div className="mt-12">
          <div className="flex items-center gap-2 py-8">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Privacy Policy
            </h2>
          </div>
          {PRIVACY_SECTIONS.map((section) => (
            <SectionBlock key={section.title} section={section} />
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-border pt-5">
          <p className="text-[11px] leading-4 text-muted-foreground/70">
            {DISCLAIMER}
          </p>
        </footer>
      </div>
    </motion.div>
  );
}
