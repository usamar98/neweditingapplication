type AnswerFact = {
  label: string;
  value: string;
};

export function AnswerSummary({
  question,
  answer,
  facts,
}: {
  question: string;
  answer: string;
  facts: readonly AnswerFact[];
}) {
  return (
    <section aria-labelledby="quick-answer-heading" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="rounded-2xl border border-primary/15 bg-primary/[0.045] p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Quick answer</p>
        <h2 id="quick-answer-heading" className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{question}</h2>
        <p className="mt-4 max-w-4xl text-sm leading-7 text-muted-foreground sm:text-base">{answer}</p>
        <dl className="mt-7 grid gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-xl border border-border bg-card/70 p-4">
              <dt className="text-xs font-medium uppercase tracking-[0.12em] text-primary">{fact.label}</dt>
              <dd className="mt-2 text-sm leading-6 text-muted-foreground">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
