import dayjs from "dayjs";

export type Block1Entry = {
  participants: string[];
  roles: string[];
  declared_authorities: string[];
  resources: string[];
  funding_sources: string[];
  obligations: string[];
  declared_goals: string[];
  formal_agreements: string[];
};

export type CaseIdentification = {
  case_type: string;
  primary_asset: string;
  decision_scale: string;
  user_participation_format: string;
  operational_control_arrangement: string;
  business_stage: string;
  participant_count: string;
  structural_relationship: string;
};

export type ReportResponse = {
  case_identification: CaseIdentification;
  original_decision_structure: Block1Entry[];
  formal_symmetry_asymmetry: Array<{ symmetry_id: string; description: string }>;
  control_distribution: Array<{ control_id: string; description: string }>;
  responsibility_distribution: Array<{ responsibility_id: string; description: string }>;
  irreversibility_points: Array<{ point_id: string; description: string }>;
  uncomfortable_questions: Array<{
    question_id: string;
    text: string;
    answer_provided: "true" | "false";
    answer_snapshot: string;
  }>;
  potential_control_loss_points: Array<{ point_id: string; description: string }>;
  uncertainty_and_gaps: {
    elements_without_formal_fixation: Array<{ gap_id: string; description: string }>;
    structural_mismatches: Array<{ mismatch_id: string; description: string }>;
  };
  report_id?: string;
  created_at?: string;
};

type Props = {
  data: ReportResponse;
  onBack: () => void;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[17px] font-bold text-(--text-primary) border-b border-(--border) pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-(--text-secondary)">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ItemList({ prefix, items }: { prefix: string; items: string[] }) {
  if (!items || items.length === 0)
    return <p className="text-sm text-(--text-muted) italic">Нет данных</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-3 text-sm text-(--text-primary) leading-relaxed">
          <span className="shrink-0 font-mono text-[11px] font-semibold text-(--accent) bg-(--bg-input) border border-(--border) rounded px-1.5 py-0.5 h-fit mt-0.5 whitespace-nowrap">
            {prefix}.{idx + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const BLOCK1_CATEGORIES: Array<{ key: keyof Block1Entry; label: string }> = [
  { key: "participants", label: "Участники" },
  { key: "roles", label: "Роли" },
  { key: "declared_authorities", label: "Заявленные полномочия" },
  { key: "resources", label: "Ресурсы" },
  { key: "funding_sources", label: "Источники финансирования" },
  { key: "obligations", label: "Обязательства сторон" },
  { key: "declared_goals", label: "Заявленные цели" },
  { key: "formal_agreements", label: "Формально зафиксированные договорённости" },
];

export function ReportDocument({ data, onBack }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-card) border border-transparent hover:border-(--border) px-3 py-1.5 rounded-lg transition-all duration-150"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Новый репорт
        </button>
        {data.created_at && (
          <span className="text-[13px] text-(--text-muted)">
            {dayjs(data.created_at).format("DD.MM.YYYY, HH:mm")}
          </span>
        )}
      </div>

      <div className="bg-(--bg-card) rounded-2xl border border-(--border) shadow-(--shadow-card) p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-(--text-muted)">
            Структурный репорт
          </p>
          <div className="flex items-start gap-3">
            <h1 className="text-[26px] font-bold text-(--text-primary) leading-snug">
              {data.case_identification.case_type}
            </h1>
          </div>
          {data.case_identification.primary_asset && (
            <p className="text-[15px] text-(--text-secondary) leading-relaxed">
              {data.case_identification.primary_asset}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-1">
            {(
              [
                { label: "Масштаб", value: data.case_identification.decision_scale },
                { label: "Участие", value: data.case_identification.user_participation_format },
                { label: "Управление", value: data.case_identification.operational_control_arrangement },
                { label: "Стадия", value: data.case_identification.business_stage },
                { label: "Участники", value: data.case_identification.participant_count },
                { label: "Отношения", value: data.case_identification.structural_relationship },
              ] as { label: string; value: string }[]
            )
              .filter((f) => f.value)
              .map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
                    {f.label}
                  </span>
                  <span className="text-[13px] text-(--text-primary) leading-snug">{f.value}</span>
                </div>
              ))}
          </div>
        </div>

        <Section title="Блок 1 — Исходная структура решения">
          {!data.original_decision_structure?.length ? (
            <p className="text-sm text-(--text-muted) italic">Нет данных</p>
          ) : (
            data.original_decision_structure.map((entry, entryIdx) => (
              <div key={entryIdx} className="flex flex-col gap-5">
                {BLOCK1_CATEGORIES.map(({ key, label }) => {
                  const items = entry[key] as string[];
                  return (
                    <SubSection key={key} title={label}>
                      <ItemList prefix="1" items={items} />
                    </SubSection>
                  );
                })}
              </div>
            ))
          )}
        </Section>

        <Section title="Блок 2 — Формальная симметрия / фактическая асимметрия">
          <ItemList prefix="2" items={data.formal_symmetry_asymmetry.map((i) => i.description)} />
        </Section>

        <Section title="Блок 3 — Распределение контроля">
          <ItemList prefix="3" items={data.control_distribution.map((i) => i.description)} />
        </Section>

        <Section title="Блок 4 — Распределение ответственности">
          <ItemList prefix="4" items={data.responsibility_distribution.map((i) => i.description)} />
        </Section>

        <Section title="Блок 5 — Точки необратимости">
          <SubSection title="Фиксируются действия, после которых возникает изменение правового или фактического положения сторон">
            <ItemList prefix="5" items={data.irreversibility_points.map((i) => i.description)} />
          </SubSection>
        </Section>

        <Section title="Блок 6 — Неудобные вопросы">
          {!data.uncomfortable_questions?.length ? (
            <p className="text-sm text-(--text-muted) italic">Нет данных</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {data.uncomfortable_questions.map((q, idx) => (
                <li key={q.question_id} className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 font-mono text-[11px] font-semibold text-(--accent) bg-(--bg-input) border border-(--border) rounded px-1.5 py-0.5 mt-0.5 whitespace-nowrap">
                      6.{idx + 1}
                    </span>
                    <p className="text-sm font-medium text-(--text-primary) leading-relaxed">{q.text}</p>
                  </div>
                  <div className="ml-11">
                    {q.answer_provided === "true" ? (
                      <div className="flex gap-2 items-start">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                        <p className="text-sm text-(--text-secondary) leading-relaxed">{q.answer_snapshot}</p>
                      </div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-(--text-muted)" />
                        <p className="text-sm text-(--text-muted) italic">Ответ в кейсе не указан</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Блок 7 — Потенциальные точки потери контроля">
          <ItemList prefix="7" items={data.potential_control_loss_points.map((i) => i.description)} />
        </Section>

        <Section title="8. Зоны неопределённости и структурные разрывы">
          <div className="flex flex-col gap-5">
            <SubSection title="8.1 — Элементы без формальной фиксации">
              <ItemList prefix="8.1" items={data.uncertainty_and_gaps.elements_without_formal_fixation.map((i) => i.description)} />
            </SubSection>
            <SubSection title="8.2 — Структурные несоответствия">
              <ItemList prefix="8.2" items={data.uncertainty_and_gaps.structural_mismatches.map((i) => i.description)} />
            </SubSection>
          </div>
        </Section>
      </div>
    </div>
  );
}
