import { z } from "zod";

export const CaseIdentificationSchema = z.object({
    case_type: z
        .string()
        .describe(
            "Тип решения или сделки. Короткий структурный ярлык. Примеры: 'вход в партнёрство', 'покупка коммерческой недвижимости', 'пассивная инвестиция', 'выдача займа', 'продажа доли'. Только то, что явно следует из описания."
        ),

    primary_asset: z
        .string()
        .describe(
            "Основной актив или структура, вокруг которой строится решение. Примеры: 'действующий бизнес (кофейня)', 'офисное помещение 120 кв.м.', 'доля в стартапе'. Пропустить, если актив явно не идентифицирован в описании."
        ),

    decision_scale: z
        .string()
        .describe(
            "Масштаб решения в финансовом или операционном выражении. Примеры: 'личный капитал 2 млн руб.', 'стоимость объекта 15 млн руб.', 'ежемесячный оборот 800 тыс. руб.'. Пропустить, если цифры или масштаб явно не указаны."
        ),

    user_participation_format: z
        .string()
        .describe(
            "Формат участия пользователя в структуре. Примеры: 'соучредитель, доля 40%', 'единственный покупатель', 'инвестор без операционного участия', 'поручитель по займу'. Пропустить, если роль пользователя явно не описана."
        ),

    operational_control_arrangement: z
        .string()
        .describe(
            "Кто осуществляет операционное управление активом или структурой. Примеры: 'операционное управление у партнёра', 'самостоятельное управление', 'управление у наёмного директора', 'управление у основателей'. Пропустить, если управленческая конфигурация явно не описана."
        ),

    business_stage: z
        .string()
        .describe(
            "Стадия бизнеса или актива на момент описания. Примеры: 'действующий бизнес, 2 года работы', 'объект на стадии переговоров', 'pre-seed, продукт в разработке', 'актив с обременением'. Пропустить, если стадия явно не указана."
        ),

    participant_count: z
        .string()
        .describe(
            "Количество и краткое описание участников структуры. Примеры: '2 (равные партнёры)', '3 (2 основателя, 1 инвестор)', '2 (заёмщик и кредитор)'. Пропустить, если состав участников явно не описан или участник один."
        ),

    structural_relationship: z
        .string()
        .describe(
            "Характер формальных отношений между участниками, если явно описан. Примеры: 'равное партнёрство без юридического оформления', 'отношения кредитор–заёмщик', 'совместное владение через ООО'. Пропустить, если тип отношений явно не зафиксирован."
        ),
});

const originalDecisionStructureSchema = z.object({
    participants: z
        .array(
            z.string().describe(
                "Name or structural designation of a participant explicitly mentioned in the case (e.g., Founder, Investor, Company, Partner). Only actors directly involved in the described decision configuration.",
            ),
        )
        .describe(
            "List of all participants explicitly involved in the decision structure. Includes individuals, legal entities, or roles that act as independent parties within the configuration. No inferred participants.",
        ),

    roles: z
        .array(
            z.string().describe(
                "Statement describing the functional role of a participant (e.g., operational management, capital provider, passive investor, managing partner). Must reflect what the participant does within the structure.",
            ),
        )
        .describe(
            "Functional roles of participants within the decision configuration. Roles must reflect explicitly stated operational, managerial, financial, or governance functions. Do not infer unstated responsibilities.",
        ),

    declared_authorities: z
        .array(
            z.string().describe(
                "Statement describing explicitly declared decision-making powers, governance rights, management authority, blocking rights, or lack of participation in management.",
            ),
        )
        .describe(
            "Explicitly stated authorities, governance powers, or limitations of authority within the structure. Includes management control, voting rights, exclusion from operations, and similar declared powers.",
        ),

    resources: z
        .array(
            z.string().describe(
                "Tangible or intangible assets explicitly mentioned in the case, such as business locations, equipment, operational model, intellectual property, or capital contribution.",
            ),
        )
        .describe(
            "Resources involved in the decision configuration. Includes business assets, operational infrastructure, capital amounts, equipment, and other assets explicitly referenced in the case.",
        ),

    funding_sources: z
        .array(
            z.string().describe(
                "Source of financial capital explicitly described in the case (e.g., investor capital, retained earnings, external financing).",
            ),
        )
        .describe(
            "Declared sources of financing supporting the structure. Only explicitly stated funding channels. Do not assume additional financing mechanisms.",
        ),

    obligations: z
        .array(
            z.string().describe(
                "Explicit commitment, duty, or obligation undertaken by a participant (e.g., profit distribution, transfer of ownership, capital injection, legal re-registration).",
            ),
        )
        .describe(
            "Obligations of each party as directly stated in the description. Includes financial, legal, operational, or structural commitments. Must reflect explicit commitments, not inferred duties.",
        ),

    declared_goals: z
        .array(
            z.string().describe(
                "Stated objective or purpose of the arrangement, such as capital attraction, business expansion, ownership restructuring, or preservation of operational control.",
            ),
        )
        .describe(
            "Goals or intended outcomes explicitly mentioned in the case. Only record clearly articulated objectives. Do not infer strategic motives.",
        ),

    formal_agreements: z
        .array(
            z.string().describe(
                "Explicitly mentioned formalized agreements, contractual mechanisms, calculation formulas, documented procedures, or legally fixed terms.",
            ),
        )
        .describe(
            "Formally documented or contractually fixed elements within the structure. Includes signed agreements, planned contracts, fixed formulas, exit procedures, payment timelines, and other legally закреплённые mechanisms.",
        ),
});

const symmetrySchema = z.object({
    symmetry_id: z
        .string()
        .describe("Unique identifier of the symmetry or asymmetry element (SA-01, SA-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing structural relationship between shares and control, obligations and authority, risk distribution relative to shares, or explicitly stated dominant authority",
        ),
});

const controlDistributionSchema = z.object({
    control_id: z
        .string()
        .describe("Unique identifier for control distribution element (CD-01, CD-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing explicitly declared control over financial flows, assets, code, access, data, final decisions, blocking rights, or unilateral change mechanisms",
        ),
});

const responsibilityDistributionSchema = z.object({
    responsibility_id: z
        .string()
        .describe("Unique identifier for responsibility element (RD-01, RD-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing explicitly declared financial, legal, operational, reputational responsibility, or personal guarantees",
        ),
});

const irreversibilityPointSchema = z.object({
    point_id: z
        .string()
        .describe("Unique identifier for irreversibility point (IP-01, IP-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing an action after which obligations arise, control is lost, liability activates, or return to original position requires legal or factual change",
        ),
});

const uncomfortableQuestionSchema = z.object({
    question_id: z
        .string()
        .describe("Identifier UQ-01 to UQ-07 corresponding to fixed uncomfortable questions"),
    text: z
        .string()
        .describe("Exact fixed Russian question text as defined in system prompt"),
    answer_provided: z
        .enum(["true", "false"])
        .describe("Indicates whether the case explicitly contains an answer to this question"),
    answer_snapshot: z
        .string()
        .describe(
            "Exact factual fragment from the case description answering the question; empty string if answer_provided is false",
        ),
});

const potentialControlLossPointSchema = z.object({
    point_id: z
        .string()
        .describe("Unique identifier for potential control loss point (CL-01, CL-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing explicitly stated situation where control may transfer, dependency arises, access becomes unilateral, restoration requires consent, or outcome depends on external factors",
        ),
});

const fixationGapSchema = z.object({
    gap_id: z
        .string()
        .describe("Unique identifier for element without formal fixation (FG-01, FG-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing explicitly mentioned element lacking legal documentation, revision mechanism, exit mechanism, or dependent on future agreements",
        ),
});

const structuralMismatchSchema = z.object({
    mismatch_id: z
        .string()
        .describe("Unique identifier for structural mismatch element (SM-01, SM-02, etc.)"),
    description: z
        .string()
        .describe(
            "Statement describing explicitly observable mismatch between share and influence, responsibility and control, risk and exit mechanism, obligations and rights, or investment and authority",
        ),
});

export const reportResponseSchema = z.object({
    case_identification: CaseIdentificationSchema.describe(
        "Краткая структурная идентификация кейса перед генерацией отчета."
    ),

    original_decision_structure: z
        .array(originalDecisionStructureSchema)
        .describe("Block 1: Structural elements of the original decision configuration"),

    formal_symmetry_asymmetry: z
        .array(symmetrySchema)
        .describe("Block 2: Structural symmetry or asymmetry between shares, control, obligations, and risk"),

    control_distribution: z
        .array(controlDistributionSchema)
        .describe("Block 3: Distribution of control over assets, flows, decisions, and access"),

    responsibility_distribution: z
        .array(responsibilityDistributionSchema)
        .describe("Block 4: Distribution of financial, legal, operational, and reputational responsibility"),

    irreversibility_points: z
        .array(irreversibilityPointSchema)
        .describe("Block 5: Points where rollback becomes structurally impossible without change of position"),

    uncomfortable_questions: z
        .array(uncomfortableQuestionSchema)
        .describe("Block 6: Seven fixed uncomfortable questions with explicit answer detection"),

    potential_control_loss_points: z
        .array(potentialControlLossPointSchema)
        .describe("Block 7: Potential situations of control transfer or dependency"),

    uncertainty_and_gaps: z
        .object({
            elements_without_formal_fixation: z
                .array(fixationGapSchema)
                .describe("Block 8.1: Elements lacking legal or procedural fixation"),
            structural_mismatches: z
                .array(structuralMismatchSchema)
                .describe("Block 8.2: Explicit structural inconsistencies or mismatches"),
        })
        .describe("Block 8: Uncertainty zones and structural gaps"),
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;