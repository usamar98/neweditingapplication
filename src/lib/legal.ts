export const legalEffectiveDate = "10 August 2026";
export const legalVersion = "2026-08-10";
export const legalContactEmail = process.env.LEGAL_CONTACT_EMAIL?.trim() || "legal@editingapp.live";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  note?: string;
};

export type LegalDocument = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  summary: string;
  sections: LegalSection[];
};

export const legalDocuments: LegalDocument[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    shortTitle: "Terms",
    description: "The agreement governing access to Editing App, accounts, customer content, AI features, subscriptions, and service use.",
    summary: "The core agreement for using Editing App, including account rules, content rights, AI limitations, billing, and termination.",
    sections: [
      {
        id: "agreement",
        title: "1. Agreement and eligibility",
        paragraphs: [
          "These Terms of Service (the “Terms”) form a binding agreement between you and Editing App for access to the Editing App website, workspace, creative tools, AI features, and related services (together, the “Service”). By creating an account, purchasing a plan, or using the Service, you agree to these Terms and the policies linked from the Legal Center.",
          "You must be at least 18 years old, or the age of legal majority where you live, and able to enter into a contract. If you use the Service for a company, agency, brand, or other organisation, you confirm that you have authority to bind that organisation. “You” then includes both you and that organisation.",
        ],
      },
      {
        id: "accounts",
        title: "2. Accounts and access",
        bullets: [
          "Provide accurate account information and keep it current.",
          "Keep sign-in credentials confidential and promptly report suspected unauthorised access.",
          "You are responsible for activity performed through your account, except to the extent caused by our failure to use reasonable care.",
          "One person or organisation may not create accounts to evade limits, enforcement, payment obligations, or restrictions.",
          "We may require account or payment verification when reasonably necessary to prevent abuse or protect the Service.",
        ],
      },
      {
        id: "service",
        title: "3. The Service",
        paragraphs: [
          "Editing App provides tools for video editing, image and video generation, background removal, performance-creative production, transcription, analysis, and related workflows. Features, model availability, output formats, processing time, and limits may change as the Service and third-party providers evolve.",
          "The Service may present automatic model selection, recommendations, transcripts, edit decisions, or generated media. These are tools for your creative process, not professional, legal, medical, financial, safety, or compliance advice. You must review outputs before relying on, publishing, or distributing them.",
        ],
      },
      {
        id: "content",
        title: "4. Your content and permissions",
        paragraphs: [
          "You retain your rights in videos, images, audio, prompts, product-page material, brand assets, and other content you submit (“Customer Content”). You grant Editing App a worldwide, non-exclusive, limited licence to host, copy, transmit, transform, and process Customer Content only as reasonably necessary to operate, secure, support, and improve the Service, fulfil your requests, and comply with law.",
          "You confirm that you have all rights, licences, notices, and consents needed to submit Customer Content and instruct us to process it. This includes permission from people whose image, voice, likeness, personal information, trademarks, music, or other protected material appears in the content.",
          "Editing App does not claim ownership of Customer Content. We do not use Customer Content to train models owned by Editing App. External AI providers may process submitted content under their commercial service terms and applicable settings, as described in the Privacy Policy and Subprocessor List.",
        ],
      },
      {
        id: "outputs",
        title: "5. Generated outputs",
        paragraphs: [
          "As between you and Editing App, and to the extent permitted by law, we do not claim ownership of the outputs generated for you. Your ability to own, register, use, or enforce rights in an output can depend on applicable law, the selected model, provider terms, and the nature of your input and human contribution.",
          "AI outputs can be inaccurate, incomplete, offensive, similar to material generated for others, or subject to third-party rights. We do not guarantee that an output is unique, non-infringing, eligible for copyright or trademark protection, or suitable for a particular platform or campaign. You are responsible for human review, rights clearance, required labels, and legal compliance before use.",
        ],
      },
      {
        id: "use-rules",
        title: "6. Acceptable use",
        paragraphs: [
          "You must follow the Acceptable Use Policy and AI & Generated Content Policy. You may not use the Service to break the law, violate rights, deceive people, create harmful impersonations, exploit children, distribute malicious material, interfere with the Service, or bypass safeguards or usage limits.",
          "We may investigate suspected misuse and may remove content, restrict a feature, suspend processing, or suspend or terminate an account when reasonably necessary to protect users, third parties, providers, or the Service. Where appropriate, we will consider context and may provide notice and an opportunity to appeal.",
        ],
      },
      {
        id: "billing",
        title: "7. Plans, subscriptions, and credits",
        paragraphs: [
          "Paid plans renew automatically at the interval and price shown at checkout until cancelled. Prices are displayed in US dollars unless checkout states otherwise, and applicable taxes may be added. The Subscription, Credits & Refund Policy forms part of these Terms and explains renewals, credit use, cancellation, failed payments, and refund handling.",
          "You can manage or cancel an active subscription online from Account settings through the hosted billing portal. Cancellation normally takes effect at the end of the current paid period unless the portal states otherwise. Permanently deleting an account cancels an active subscription immediately and may end access without a prorated refund, except where required by law.",
        ],
      },
      {
        id: "third-parties",
        title: "8. Third-party services",
        paragraphs: [
          "The Service relies on payment, hosting, storage, authentication, and AI service providers. Their availability and processing can affect the Service. When you choose a particular AI model or proceed to a hosted payment page, the relevant provider may apply its own terms and privacy notice in addition to ours.",
          "References to third-party brands, models, social platforms, or products do not imply endorsement, partnership, or guaranteed compatibility. You are responsible for complying with the rules of platforms where you publish or advertise content.",
        ],
      },
      {
        id: "intellectual-property",
        title: "9. Editing App property and feedback",
        paragraphs: [
          "Editing App and its licensors own the Service, software, interface, branding, documentation, templates, and other materials we provide, excluding Customer Content. Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable right to use the Service during your account term for your internal or commercial creative work.",
          "If you send feedback or suggestions, you permit us to use them without restriction or payment, but we will not identify you publicly as the source without permission.",
        ],
      },
      {
        id: "termination",
        title: "10. Deactivation and termination",
        paragraphs: [
          "You may deactivate your account after scheduling cancellation of an active subscription. Deactivation pauses workspace access but keeps account and project data available for reactivation. You may permanently delete your account from Account settings after identity confirmation. The Privacy Policy explains deletion and limited legal-retention exceptions.",
          "We may suspend or terminate access for material breach, unlawful activity, non-payment, security risk, provider requirement, or conduct that creates material harm. We will provide notice when reasonably possible. Provisions that by their nature should continue—including payment obligations, content responsibility, intellectual property, disclaimers, and liability limits—survive termination.",
        ],
      },
      {
        id: "disclaimers",
        title: "11. Disclaimers",
        paragraphs: [
          "To the maximum extent permitted by law, the Service is provided “as is” and “as available.” We do not promise uninterrupted or error-free operation, a particular processing time, model availability, campaign result, platform approval, revenue outcome, or legal status for generated content. Nothing in these Terms excludes warranties or rights that cannot lawfully be excluded.",
        ],
      },
      {
        id: "liability",
        title: "12. Liability",
        paragraphs: [
          "To the maximum extent permitted by law, Editing App will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, revenue, goodwill, data, or business opportunity. Our total liability arising from the Service will not exceed the amount you paid to Editing App for the Service during the 12 months before the event giving rise to the claim.",
          "These limits do not apply where prohibited by law, or to liability that cannot legally be limited. Consumer rights available under mandatory local law remain unaffected.",
        ],
      },
      {
        id: "indemnity",
        title: "13. Responsibility for claims",
        paragraphs: [
          "If you use the Service for a business, you will defend and indemnify Editing App against third-party claims, losses, and reasonable costs arising from your Customer Content, published outputs, breach of these Terms, or violation of another person’s rights, except to the extent caused by Editing App’s own breach or unlawful conduct.",
        ],
      },
      {
        id: "changes-contact",
        title: "14. Changes and contact",
        paragraphs: [
          "We may update these Terms to reflect product, legal, or business changes. We will post the updated date and provide additional notice when a change materially reduces your rights or materially increases your obligations. Continuing to use the Service after an update takes effect means you accept the revised Terms; if you do not agree, stop using the Service and cancel before the effective date.",
          `Questions about these Terms may be sent to ${legalContactEmail}. These Terms are governed by applicable law without depriving consumers of mandatory protections in their place of residence.`,
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    description: "How Editing App collects, uses, discloses, retains, and protects account, billing, activity, and creative-workspace information.",
    summary: "What personal information the Service handles, why it is used, who receives it, how long it is kept, and the choices available to you.",
    sections: [
      {
        id: "scope",
        title: "1. Scope and our role",
        paragraphs: [
          "This Privacy Policy explains how Editing App handles personal information when you visit the website, create or use an account, upload or generate media, submit a product URL, buy a subscription, contact us, or otherwise use the Service.",
          "Editing App acts as the controller of account, billing relationship, service activity, and support information. When a business customer submits personal information within Customer Content, that customer may be the controller and Editing App may process the content on its behalf to provide the requested service.",
        ],
      },
      {
        id: "collection",
        title: "2. Information we collect",
        bullets: [
          "Account and profile information: email address, display name, username, password-protected account records, profile picture, account status, policy-acceptance version, creation time, and sign-in time.",
          "Customer Content: uploaded video, images, audio, filenames, project names, prompts, product URLs, source-page material, transcripts, edit settings, generated outputs, and associated technical media details.",
          "AI workflow information: selected model or automatic-routing preference, requested style, audience, platform, duration, resolution, and processing status or error information.",
          "Billing information: plan, subscription status, billing-customer and subscription references, invoices, payment state, and cancellation status. Full payment-card details are entered on and handled by the payment provider, not stored by Editing App.",
          "Service activity: last-seen time, sign-in activity, feature and usage events, credit-related usage, request counts, and coarse country code derived from network information supplied by the hosting layer. Editing App does not store the full network address in the account-activity record, although infrastructure providers may process it in operational logs.",
          "Communications: messages, requests, complaint details, and information you provide when contacting us.",
          "Essential device and log information: browser and device characteristics, timestamps, request identifiers, security events, and diagnostic information processed by us or our infrastructure providers to operate and protect the Service.",
        ],
      },
      {
        id: "sources",
        title: "3. Sources of information",
        bullets: [
          "Directly from you when you register, upload, generate, pay, change settings, or contact us.",
          "Automatically from your browser, device, and use of the Service.",
          "From payment, authentication, infrastructure, storage, and AI service providers that help complete your request.",
          "From a webpage you direct the performance-creative feature to access. You are responsible for having authority to submit that URL and use its content.",
        ],
      },
      {
        id: "purposes",
        title: "4. Why we use information",
        bullets: [
          "Create and authenticate accounts, maintain profiles, and provide private workspace access.",
          "Upload, analyse, transcribe, edit, generate, store, and deliver requested media and project results.",
          "Route requests to selected or suitable AI models and show processing progress.",
          "Provide subscriptions, measure usage, administer credits, process payments, prevent duplicate charges, and support cancellation or refunds.",
          "Operate, troubleshoot, secure, prevent abuse of, and improve the reliability and usability of the Service.",
          "Respond to support, privacy, legal, copyright, accessibility, and security requests.",
          "Comply with law, enforce agreements, and establish or defend legal claims.",
          "Complete a financing, reorganisation, acquisition, sale, or transfer involving all or part of the business, subject to appropriate confidentiality and notice where required.",
        ],
      },
      {
        id: "legal-bases",
        title: "5. Legal bases where required",
        bullets: [
          "Contract: to create your account, provide requested features, deliver outputs, and administer paid plans.",
          "Legitimate interests: to secure, maintain, understand, and improve the Service; prevent fraud and abuse; and protect users and our business, balanced against your rights.",
          "Legal obligation: to keep required transaction records, respond to lawful requests, and meet tax, accounting, consumer-protection, or regulatory duties.",
          "Consent: where we specifically ask for it. You may withdraw consent for future processing, but this does not affect processing already lawfully completed.",
        ],
      },
      {
        id: "disclosures",
        title: "6. How information is disclosed",
        paragraphs: [
          "We disclose information only as needed to operate the Service, follow your instructions, complete transactions, protect rights and safety, comply with law, or complete a business transaction. Recipient categories include hosting and infrastructure providers, authentication and data-storage providers, payment processors, AI and media-processing providers, professional advisers, authorities where legally required, and a successor in a corporate transaction.",
          "When you upload a profile picture, the picture is stored as a publicly retrievable profile asset. Do not use an avatar you want to keep confidential. Project sources, prompts, generated media, transcripts, and exports are intended to remain private to the account and are made available through controlled access, unless you download, publish, or share them.",
          "Editing App does not sell personal information for money and does not share personal information for cross-context behavioural advertising. We do not knowingly sell or share personal information of people under 16. If these practices change, we will update this policy and provide legally required choices before the change applies.",
        ],
      },
      {
        id: "ai-processing",
        title: "7. AI processing",
        paragraphs: [
          "Prompts and the portions of Customer Content needed to perform a request may be sent to the AI provider supporting the model or workflow you select. Automatic routing may choose among eligible models based on the preferences and capability requested. Provider handling, including temporary retention and abuse monitoring, can depend on the provider’s commercial terms and service configuration.",
          "Editing App does not use Customer Content to train models owned by Editing App. Do not submit highly sensitive personal information or confidential material unless you have assessed the selected workflow and have authority to use the relevant provider. See the AI & Generated Content Policy and Subprocessor List for more information.",
        ],
      },
      {
        id: "retention",
        title: "8. Retention",
        bullets: [
          "Account and profile records are generally kept while the account remains active or inactive and are deleted when the account is permanently deleted, subject to the exceptions below.",
          "Projects, uploaded media, transcripts, edit settings, prompts, and outputs are generally kept until you delete the project or permanently delete the account. Removal from active systems may not be instantaneous, and limited backup or recovery copies may remain until overwritten under normal retention cycles.",
          "Activity, usage, and security records are kept for as long as reasonably needed to operate the account, administer plans, investigate abuse, maintain security, and resolve disputes.",
          "Billing, tax, fraud-prevention, legal-request, and transaction records may be kept after account deletion for the period required or permitted by law and by the payment provider.",
          "We may retain a minimal record of a request or enforcement action where needed to demonstrate compliance, prevent repeat abuse, or establish or defend legal claims.",
        ],
      },
      {
        id: "security-transfers",
        title: "9. Security and international processing",
        paragraphs: [
          "We use reasonable administrative, technical, and organisational safeguards designed for the nature of the Service and information. No online service can guarantee absolute security. Protect your password, use a trusted device, and notify us promptly if you believe your account is compromised.",
          "Editing App and its service providers may process information in countries other than where you live. Where required, we rely on recognised transfer mechanisms or another lawful basis and apply contractual or organisational safeguards appropriate to the transfer.",
        ],
      },
      {
        id: "rights",
        title: "10. Your privacy choices and rights",
        bullets: [
          "Access or obtain a copy of personal information associated with you.",
          "Correct inaccurate profile or account information.",
          "Request deletion or restriction, subject to legal and operational exceptions.",
          "Object to certain processing or withdraw consent where processing relies on consent.",
          "Receive portable information where applicable and technically feasible.",
          "Appeal a decision or complain to your local data-protection authority where that right exists.",
          "Use an authorised agent where local law permits, subject to identity and authority verification.",
        ],
        note: "You can edit profile details, cancel billing, deactivate, or permanently delete an account from Account settings. For another privacy request, email the address below. We may verify identity before responding and will not discriminate against you for exercising a privacy right.",
      },
      {
        id: "children",
        title: "11. Children",
        paragraphs: [
          "The Service is not directed to children and may be used only by people who meet the eligibility requirement in the Terms. We do not knowingly collect personal information from a child who cannot legally consent to the Service. If you believe a child provided information, contact us so we can investigate and take appropriate action.",
        ],
      },
      {
        id: "changes-contact",
        title: "12. Changes and contact",
        paragraphs: [
          "We may update this policy when the Service, providers, or legal requirements change. The effective date identifies the current version. We will provide additional notice when required for a material change.",
          `To exercise a privacy right or ask a question, contact ${legalContactEmail}. Include the email associated with your account and enough detail to understand the request, but do not send a password, payment-card number, access credential, or confidential media by email.`,
        ],
      },
    ],
  },
  {
    slug: "subscriptions-credits-refunds",
    title: "Subscription, Credits & Refund Policy",
    shortTitle: "Billing policy",
    description: "Clear rules for recurring plans, monthly credits, model-dependent usage, cancellation, failed payments, and refund requests.",
    summary: "How recurring billing, monthly credits, cancellation, account deletion, and refund reviews work.",
    sections: [
      {
        id: "plans",
        title: "1. Paid plans and renewal",
        paragraphs: [
          "Creator, Studio, and Business are recurring subscription plans billed at the price and interval displayed at checkout. A subscription renews automatically until you cancel it. Before payment, checkout shows the plan, price, billing interval, and any applicable tax.",
          "We may change plan prices or included features for a future billing period. We will provide notice required by law before a price change applies to an existing subscription. If you do not agree, cancel before the new price takes effect.",
        ],
      },
      {
        id: "credits",
        title: "2. Credits and usage",
        bullets: [
          "Credits are Service units used to measure eligible AI generation and media processing; they are not money, stored value, or a cryptocurrency.",
          "Credit cost can vary by feature, selected model, duration, resolution, audio, output count, and other settings. Any cost shown in the product for a request controls over general estimates on a marketing page.",
          "Video-minute and output estimates are planning guides, not fixed quotas. Provider capabilities and cost can change.",
          "An eligible account may claim a one-time welcome allocation of 20 credits without payment. It is limited to four image requests at five credits each using the fixed welcome image model. Model selection and all other generation or processing features require an active paid subscription. The allocation is limited to one claim per account and does not renew or convert to cash.",
          "Included credits are allocated for the applicable subscription period. Unless a plan expressly says otherwise, unused included credits do not roll over and have no cash or refund value.",
          "Credits may not be sold, transferred between unrelated accounts, redeemed for money, or obtained through abuse, chargeback, or circumvention.",
          "The Service reserves the displayed credits before an operation starts so simultaneous requests cannot overspend the same balance. A reservation is settled when the operation completes.",
          "If an operation reaches terminal failure before paid provider processing begins, its reserved credits are released automatically. After paid provider processing begins, some or all reserved credits may be consumed because the third-party cost may already have been incurred, even if a usable output is not returned. Contact us if the account record appears incorrect.",
        ],
      },
      {
        id: "authorisation",
        title: "3. Payment authorisation and taxes",
        paragraphs: [
          "By starting a subscription, you authorise the payment provider to charge the selected payment method at each renewal until cancellation. You are responsible for keeping billing information current. Taxes may be added where required. Your bank or payment provider may apply conversion or other fees that Editing App does not control.",
        ],
      },
      {
        id: "failed-payments",
        title: "4. Failed or disputed payments",
        paragraphs: [
          "If a payment fails, access to paid features may be limited while the payment provider retries or requests an updated method. We may suspend a paid plan after reasonable notice when an amount remains due.",
          "Contact us before filing a chargeback so we can investigate a duplicate, unauthorised, or incorrect charge. We may restrict an account while a chargeback is pending and may remove credits or access associated with a reversed payment, subject to applicable law.",
        ],
      },
      {
        id: "cancellation",
        title: "5. Cancellation",
        paragraphs: [
          "You can cancel online from Account settings by choosing Cancel subscription and completing the hosted billing flow. You do not need to contact a sales representative. The billing portal shows when cancellation will take effect. Unless it states otherwise, you keep paid access through the end of the current billing period and will not be charged for the next period.",
          "Deactivating an account requires an active subscription to be scheduled for cancellation first. Permanently deleting an account cancels an active subscription immediately, deletes the login and workspace content, and may end access before the paid period finishes. Account deletion does not create a prorated refund except where required by law or expressly approved under this policy.",
        ],
      },
      {
        id: "refunds",
        title: "6. Refunds",
        paragraphs: [
          "Subscription charges are generally non-refundable once the billing period begins or credits or paid features are used. We review timely requests for duplicate charges, unauthorised charges, a material billing error, or a material Service failure that prevented use of the purchased plan. Approval and amount depend on the circumstances and applicable law.",
          "Mandatory consumer cancellation, cooling-off, refund, or remedy rights in your jurisdiction remain available. To request review, contact us promptly with the account email, charge date, plan, and reason. Do not email full payment-card details.",
        ],
      },
      {
        id: "trials-promotions",
        title: "7. Trials and promotions",
        paragraphs: [
          "If we offer a trial, coupon, or promotion, the specific offer terms control. Unless checkout clearly says otherwise, a trial that requires a payment method converts to the displayed paid subscription when the trial ends and then renews until cancelled. Promotional credits may expire and may be limited to one account, customer, or organisation. The 20-credit welcome image allocation is a one-time, non-renewing offer and does not itself start a paid subscription.",
        ],
      },
      {
        id: "contact",
        title: "8. Billing help",
        paragraphs: [
          `Manage invoices, payment methods, and cancellation from Account settings. For a billing or refund review that cannot be completed there, contact ${legalContactEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    shortTitle: "Acceptable use",
    description: "Rules that protect people, rights holders, providers, and the Service from illegal, deceptive, exploitative, or disruptive use.",
    summary: "The content and conduct rules that apply to every account, upload, prompt, generation, and output.",
    sections: [
      {
        id: "principle",
        title: "1. Core principle",
        paragraphs: [
          "Use Editing App lawfully, honestly, and with respect for the safety, privacy, and rights of others. This policy applies to Customer Content, prompts, product URLs, generated outputs, account conduct, and attempts to use or access the Service.",
        ],
      },
      {
        id: "illegal-harmful",
        title: "2. Illegal and seriously harmful content",
        bullets: [
          "Child sexual abuse or exploitation material, grooming, sexualisation of minors, or any attempt to create, transform, conceal, or distribute such content.",
          "Non-consensual intimate imagery, sexual extortion, voyeuristic content, or sexual content using a person’s likeness without permission.",
          "Material that facilitates terrorism, violent extremism, human trafficking, targeted violence, or credible threats of harm.",
          "Instructions or media intended to facilitate serious wrongdoing, illegal weapons activity, fraud, theft, evasion of law enforcement, or physical harm.",
          "Content or conduct that is illegal where you or the affected person is located.",
        ],
      },
      {
        id: "deception-rights",
        title: "3. Deception, impersonation, and rights",
        bullets: [
          "Deceptive impersonation, identity theft, fabricated endorsements, fraudulent evidence, or media intended to mislead people about a real person’s words or actions.",
          "False product claims, invented discounts, fabricated reviews, unsupported guarantees, or misleading advertising claims.",
          "Harassment, stalking, doxxing, hate, discrimination, humiliation, or targeted abuse.",
          "Infringement or misappropriation of copyright, trademark, publicity, privacy, confidentiality, data-protection, or other rights.",
          "Processing personal or biometric information without a lawful basis, required notice, or valid permission.",
        ],
      },
      {
        id: "high-impact",
        title: "4. High-impact and sensitive decisions",
        paragraphs: [
          "Do not use Editing App outputs as the sole basis for decisions about employment, housing, credit, insurance, education, legal services, medical care, public benefits, or another high-impact eligibility decision. Do not present generated content as professional advice or an authenticated record without qualified human review.",
        ],
      },
      {
        id: "platform-abuse",
        title: "5. Service and platform abuse",
        bullets: [
          "Malware, phishing, credential theft, spam, abusive automation, denial-of-service activity, or attempts to compromise accounts or systems.",
          "Probing or exploiting a vulnerability outside the Responsible Disclosure rules.",
          "Bypassing safeguards, authentication, rate limits, content controls, plan restrictions, credits, model restrictions, or payment requirements.",
          "Scraping, reverse engineering, reselling access, or using automated means in a way that harms the Service or violates applicable terms.",
          "Submitting a product URL or media you are not authorised to access, copy, analyse, or use.",
        ],
      },
      {
        id: "enforcement",
        title: "6. Enforcement and reporting",
        paragraphs: [
          "We may block a request, remove content, preserve relevant records, limit a feature, suspend processing, or suspend or terminate an account based on severity, repetition, legal duty, provider requirement, or risk to people or the Service. We may report apparent criminal activity or imminent harm when required or permitted by law.",
          `To report misuse, email ${legalContactEmail} with the relevant account or content details. Do not send unlawful media as an attachment; describe it and provide a controlled reference instead.`,
        ],
      },
    ],
  },
  {
    slug: "ai-generated-content",
    title: "AI & Generated Content Policy",
    shortTitle: "AI policy",
    description: "Responsibilities and transparency rules for model selection, prompts, synthetic media, advertising claims, and human review.",
    summary: "How multi-model AI is used in Editing App and what users must do before publishing generated media.",
    sections: [
      {
        id: "how-ai-works",
        title: "1. How AI is used",
        paragraphs: [
          "Editing App lets you select an available model or ask an automatic agent to choose an eligible model for the requested workflow. A request can include prompts, source media, a product URL, audience and platform choices, duration, resolution, and style settings. The relevant information is processed to create or analyse media and return a result to your workspace.",
          "Model names describe third-party capabilities available through the Service. Availability, limits, safety controls, pricing, and output quality can change without notice. Automatic selection is a product recommendation, not a guarantee that a model is best for every purpose.",
        ],
      },
      {
        id: "input-responsibility",
        title: "2. Inputs and permission",
        bullets: [
          "Use only media, URLs, voices, likenesses, brands, and other material you have authority to process.",
          "Obtain notices and consent required for personal information, voice cloning, face or likeness use, testimonials, and sensitive content.",
          "Do not place secrets, access credentials, full payment details, health records, or other unnecessary sensitive information in a prompt.",
          "Treat instructions found inside source content as untrusted data; do not attempt to use embedded instructions to override safeguards.",
        ],
      },
      {
        id: "review",
        title: "3. Human review is required",
        bullets: [
          "Check factual claims, spelling, identity, product details, prices, disclosures, and visual or audio artefacts.",
          "Confirm that music, fonts, images, marks, people, and other elements are cleared for the intended use.",
          "Assess whether the output could be mistaken for authentic footage and add a clear AI or synthetic-media disclosure where law, platform rules, or context requires it.",
          "Do not rely on generated transcripts, captions, timing, recommendations, or campaign copy without reviewing the source.",
          "Test exports and platform requirements before spending media budget or publishing a campaign.",
        ],
      },
      {
        id: "commercial-use",
        title: "4. Advertising and commercial use",
        paragraphs: [
          "You are responsible for substantiating every objective advertising claim. Do not publish invented prices, discounts, reviews, endorsements, ingredients, performance claims, guarantees, scarcity, or results. Platform presets and source-aware planning reduce risk but do not replace legal, brand, or platform review.",
          "Do not imply that a real person, customer, public figure, competitor, or rights holder endorses a product unless you have documented permission. Synthetic testimonials and deceptive before-and-after media are prohibited.",
        ],
      },
      {
        id: "output-limitations",
        title: "5. Output limitations and rights",
        paragraphs: [
          "Outputs may be inaccurate, biased, offensive, non-unique, or similar to existing material. An output may not qualify for intellectual-property protection and may implicate third-party rights. Editing App does not provide rights clearance or guarantee platform acceptance, campaign performance, factual accuracy, or non-infringement.",
          "As between you and Editing App, we do not claim ownership of your generated output to the extent permitted by law. Provider terms and applicable law may impose additional conditions.",
        ],
      },
      {
        id: "training-privacy",
        title: "6. Data use and providers",
        paragraphs: [
          "Editing App does not use Customer Content to train models owned by Editing App. The content needed for a request may be processed by the provider supporting the chosen model. Provider retention, safety review, and training restrictions depend on the commercial service and configuration. Review the Privacy Policy and Subprocessor List before submitting sensitive business material.",
        ],
      },
      {
        id: "enforcement",
        title: "7. Safety action",
        paragraphs: [
          "We may refuse prompts or outputs, restrict models, preserve evidence, or suspend an account when content violates this policy, the Acceptable Use Policy, provider rules, or law. Repeated attempts to evade safeguards are themselves a violation.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Notice",
    shortTitle: "Cookies",
    description: "The limited cookies and similar storage needed for account sessions, security, and hosted payment flows.",
    summary: "Editing App currently uses essential account and security storage, not behavioural-advertising cookies.",
    sections: [
      {
        id: "what",
        title: "1. What cookies are",
        paragraphs: [
          "Cookies are small data files stored by a browser. Similar technologies can store or retrieve a small amount of information needed to keep a session working, remember a choice, prevent abuse, or complete a transaction.",
        ],
      },
      {
        id: "used",
        title: "2. What Editing App uses",
        bullets: [
          "Authentication and session storage used to keep you signed in, refresh a valid session, and sign you out.",
          "Security and request state used to protect account actions, maintain service integrity, and return you to the correct page.",
          "Hosted payment storage set by the payment provider when you open checkout or the billing portal. That provider controls its own storage under its privacy notice.",
        ],
        note: "As of the effective date, Editing App does not set non-essential behavioural-advertising or cross-site tracking cookies. The app does record authenticated last-seen activity and coarse country information as described in the Privacy Policy; this is not used for behavioural advertising.",
      },
      {
        id: "duration",
        title: "3. Duration and control",
        paragraphs: [
          "Session storage may expire when you sign out, close the browser, or when the configured session period ends. Other essential storage can remain for a limited period needed for security or account continuity.",
          "You can block or delete cookies in browser settings, but blocking essential storage can prevent sign-in, account access, checkout, or billing management. Controls for storage on a hosted payment page are provided by that payment provider.",
        ],
      },
      {
        id: "changes",
        title: "4. Changes and contact",
        paragraphs: [
          `If Editing App later introduces optional analytics, advertising, or personalisation storage, we will update this notice and provide a consent choice where required. Questions may be sent to ${legalContactEmail}.`,
        ],
      },
    ],
  },
  {
    slug: "subprocessors",
    title: "Subprocessor List",
    shortTitle: "Subprocessors",
    description: "The principal service-provider categories used to operate accounts, storage, billing, hosting, and AI processing.",
    summary: "Who helps operate the Service and the limited purpose for which each provider may process information.",
    sections: [
      {
        id: "meaning",
        title: "1. About this list",
        paragraphs: [
          "Editing App uses service providers to operate the Service. A provider is a subprocessor when it processes personal information on our behalf for a business customer. The exact provider involved in a creative request can depend on the model or workflow selected and the Service configuration.",
          "This public list gives commercially useful transparency without publishing credentials, internal system locations, account identifiers, or security-sensitive configuration.",
        ],
      },
      {
        id: "core-providers",
        title: "2. Core providers",
        bullets: [
          "Vercel — website and application hosting, network delivery, and operational logs.",
          "Supabase — account authentication, transactional account email, database services, and customer file storage.",
          "Stripe — hosted checkout, recurring subscription billing, invoices, payment-method management, fraud prevention, and cancellation portal.",
          "fal.ai — AI model access and processing for selected image, video, transcription, analysis, and creative-generation workflows.",
          "Configured AI model providers — a request may be processed by the model developer or infrastructure provider made available through fal.ai, or by another commercial AI provider configured for a transcription or analysis workflow.",
        ],
      },
      {
        id: "data-purpose",
        title: "3. Data and purpose limitations",
        paragraphs: [
          "Providers receive only the account, transaction, request, prompt, source content, output, device, or operational information reasonably needed for their function. Full payment-card information is handled by Stripe. AI providers receive the content and instructions needed to perform the selected request. Providers may also process limited diagnostic and security information.",
          "Processing locations and transfer safeguards depend on provider terms, customer configuration, and applicable law. Review the Privacy Policy for international processing and retention information.",
        ],
      },
      {
        id: "changes",
        title: "4. Changes and business requests",
        paragraphs: [
          `We may add, remove, or replace providers as the Service evolves. Material changes will be reflected here. Business customers seeking data-processing terms or subprocessor-change information can contact ${legalContactEmail}. A formal data-processing addendum requires the customer’s and service provider’s completed legal-entity and transfer details.`,
        ],
      },
    ],
  },
  {
    slug: "security",
    title: "Security & Responsible Disclosure",
    shortTitle: "Security",
    description: "A public, non-sensitive overview of account and content safeguards plus rules for reporting a suspected vulnerability.",
    summary: "How to report a security concern safely and what you can expect from Editing App.",
    sections: [
      {
        id: "approach",
        title: "1. Security approach",
        paragraphs: [
          "Editing App uses layered administrative, technical, and organisational safeguards appropriate to a private creative workspace. Measures include access controls, private project access, limited-duration media delivery, account confirmation for destructive actions, restricted administrative access, payment handling by a dedicated payment provider, and operational monitoring.",
          "This page intentionally omits credentials, internal addresses, system topology, account identifiers, security rules, and detailed defensive configuration. No internet service is perfectly secure, and this overview is not a certification, audit report, or guarantee against every threat.",
        ],
      },
      {
        id: "customer-actions",
        title: "2. Protecting your account",
        bullets: [
          "Use a unique password and protect the email account used for sign-in.",
          "Use only trusted devices and networks for confidential creative work.",
          "Do not place passwords, access credentials, or full payment details in prompts, filenames, project names, or support messages.",
          "Review account, billing, and generated content regularly and report unexpected activity promptly.",
          "Delete projects and outputs when they are no longer needed and permanently delete the account when you no longer require the Service.",
        ],
      },
      {
        id: "reporting",
        title: "3. Reporting a vulnerability",
        paragraphs: [
          `Send a concise report to ${legalContactEmail} with the subject “Security disclosure.” Include the affected page or feature, a clear impact statement, reproducible steps, and supporting screenshots or logs with personal information removed. Do not include credentials, unrelated customer data, or confidential media.`,
          "We aim to acknowledge a credible report, assess severity, and communicate material progress when contact information is available. Response timing depends on impact, complexity, provider coordination, and the quality of the report.",
        ],
      },
      {
        id: "research-rules",
        title: "4. Research rules",
        bullets: [
          "Use only accounts and content you own or have explicit permission to test.",
          "Stop immediately if you encounter another person’s data and report what happened without retaining, downloading, or disclosing it.",
          "Do not use denial of service, destructive testing, social engineering, spam, automated high-volume traffic, physical attacks, or provider-credential testing.",
          "Do not alter, delete, encrypt, publish, or exfiltrate data, and do not demand payment or threaten disclosure.",
          "Give us a reasonable opportunity to investigate and remediate before public disclosure.",
        ],
        note: "Good-faith research that follows these rules will not be treated by Editing App as malicious access. This statement cannot authorise testing of third-party services or excuse conduct prohibited by law.",
      },
      {
        id: "incidents",
        title: "5. Security incidents",
        paragraphs: [
          "If we confirm a security incident affecting personal information, we will investigate, contain and remediate it, coordinate with relevant providers, and notify affected people or authorities when required by law. Notices will avoid details that would create additional security risk.",
        ],
      },
    ],
  },
  {
    slug: "copyright-content-complaints",
    title: "Copyright & Content Complaints",
    shortTitle: "Content complaints",
    description: "A process for reporting alleged copyright, trademark, privacy, likeness, or other rights violations connected to the Service.",
    summary: "How rights holders can submit a complete content complaint and how affected users may respond.",
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        paragraphs: [
          "Editing App is a private creative workspace and does not ordinarily publish Customer Content. We nevertheless take credible reports of copyright, trademark, privacy, publicity, confidentiality, and other rights violations seriously. This policy explains the information needed to investigate.",
        ],
      },
      {
        id: "report",
        title: "2. Submitting a complaint",
        bullets: [
          "Your full name, organisation if applicable, and reliable contact information.",
          "A clear description of the protected work, person, mark, or other right involved.",
          "The specific Editing App location, account, project reference, or other information reasonably sufficient to identify the material. Do not send unlawful or intimate material as an attachment.",
          "An explanation of why the use is unauthorised or unlawful and what action you request.",
          "A statement that you have a good-faith belief the complained-of use is not authorised by the rights holder, its agent, or law.",
          "A statement that the information is accurate and that you are the rights holder or authorised to act for the rights holder.",
          "Your physical or electronic signature.",
        ],
        note: `Send the completed complaint to ${legalContactEmail} with the subject “Content complaint.”`,
      },
      {
        id: "response",
        title: "3. Review and response",
        paragraphs: [
          "We may request clarification, preserve relevant records, restrict access to identified content, notify the account holder, or take other proportionate action. We may decline an incomplete, fraudulent, abusive, or unsupported request. Information in a complaint may be shared with the affected user or relevant provider where necessary to evaluate and respond.",
          "The affected user may respond with evidence of permission, ownership, lawful use, mistaken identification, or other relevant context. Restoring access depends on applicable law, provider requirements, the evidence, and risk to affected people.",
        ],
      },
      {
        id: "repeat",
        title: "4. Repeat violations and misuse",
        paragraphs: [
          "We may suspend or terminate accounts that repeatedly or seriously violate rights. Knowingly submitting a false complaint or response can cause harm and may create legal liability. This process does not replace court orders, emergency reporting, or remedies available under applicable law.",
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    title: "Accessibility Statement",
    shortTitle: "Accessibility",
    description: "Editing App’s commitment to making public information, account controls, and creative workflows usable by more people.",
    summary: "Our accessibility approach, current measures, limitations, and a way to request help or an alternative format.",
    sections: [
      {
        id: "commitment",
        title: "1. Our commitment",
        paragraphs: [
          "Editing App aims to make its website and core account workflows accessible to people with disabilities. We consider recognised web-accessibility practices when designing navigation, forms, controls, colour contrast, focus states, responsive layouts, and content structure.",
        ],
      },
      {
        id: "measures",
        title: "2. Measures in the Service",
        bullets: [
          "Semantic headings, landmarks, labels, and keyboard-operable controls in core workflows.",
          "Visible focus treatment, descriptive button text, status messages, and validation feedback.",
          "Responsive pages designed for mobile, tablet, zoom, and reflow.",
          "Alternative text or decorative treatment for images where appropriate.",
          "Ongoing automated and manual review as features change.",
        ],
      },
      {
        id: "limitations",
        title: "3. Limitations",
        paragraphs: [
          "Creative media editing is highly visual and some generated media, third-party hosted pages, model outputs, uploaded customer content, or advanced timeline interactions may not be fully accessible in every assistive-technology combination. Accessibility can also be affected by third-party providers outside our direct control.",
          "This statement describes an ongoing effort and is not a claim of formal certification or perfect conformance with every standard in every jurisdiction.",
        ],
      },
      {
        id: "feedback",
        title: "4. Feedback and alternative access",
        paragraphs: [
          `If a page or workflow is difficult to use, contact ${legalContactEmail}. Describe the page, task, assistive technology or browser if relevant, and the format or accommodation that would help. Do not include a password or confidential media. We will review the request and provide a reasonable alternative where feasible.`,
        ],
      },
    ],
  },
];

export const legalDocumentSlugs = legalDocuments.map((document) => document.slug);

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}
