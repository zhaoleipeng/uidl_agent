import { END, START, StateGraph } from "@langchain/langgraph";
import type { RunnableConfig } from "langchain/schema/runnable";
import { UIDLDocument } from "../types/uidl";

export interface AgentInput {
  requirements: string;
  uidl: UIDLDocument;
}

export interface AgentResult {
  updatedUIDL?: UIDLDocument;
  suggestions?: string[];
  errors?: string[];
}

type AgentNode = (state: AgentState, config?: RunnableConfig) => Promise<AgentState> | AgentState;

interface KnowledgeRetrievalPlan {
  targets: string[];
  notes: string[];
}

interface EditPlanItem {
  description: string;
  targetPath?: string;
}

interface AgentState extends AgentInput {
  understanding?: string;
  todos?: string[];
  retrievalPlan?: KnowledgeRetrievalPlan;
  editPlan?: EditPlanItem[];
  updatedUIDL?: UIDLDocument;
  suggestions?: string[];
  errors?: string[];
}

interface AgentLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
}

const REQUIREMENT_ANALYSIS_PROMPT = `将需求说明转换为简洁的开发摘要，突出目标、限制与验收标准。`;

const TODO_BREAKDOWN_PROMPT = `根据需求说明拆解Todo列表，按步骤列出输入、动作、预期输出。`;

const KNOWLEDGE_RETRIEVAL_PROMPT = `针对以下六大板块检索已有知识并给出缺口：
- 基础信息
- importMaps
- nodeUIDL
- resources
- observerDataSources
- flows/containers`;

const EDIT_PLAN_PROMPT = `综合Todo与知识检索结果，输出需要改动的节点、原因与预期效果。`;

function createLogger(): AgentLogger {
  return {
    info: (message: string) => console.log(`[agent] ${message}`),
    warn: (message: string) => console.warn(`[agent][warn] ${message}`),
    error: (message: string, error?: unknown) => console.error(`[agent][error] ${message}`, error),
  };
}

function withErrorHandling(nodeName: string, logger: AgentLogger, node: AgentNode): AgentNode {
  return async (state, config) => {
    try {
      logger.info(`${nodeName} start`);
      const result = await node(state, config);
      logger.info(`${nodeName} done`);
      return result;
    } catch (error) {
      logger.error(`${nodeName} failed`, error);
      return {
        ...state,
        errors: [...(state.errors ?? []), `${nodeName} failed: ${(error as Error).message}`],
      };
    }
  };
}

const requirementUnderstandingNode: AgentNode = (state) => {
  const trimmed = state.requirements.trim();
  const understanding = `${REQUIREMENT_ANALYSIS_PROMPT}\n原始需求: ${trimmed}`;
  return {
    ...state,
    understanding,
  };
};

const todoBreakdownNode: AgentNode = (state) => {
  const todos = trimmedLines(state.requirements).map((item, index) => `步骤${index + 1}: ${item}`);
  if (todos.length === 0) {
    todos.push("梳理需求后未找到明确Todo，请补充需求细节。");
  }

  return {
    ...state,
    todos: [TODO_BREAKDOWN_PROMPT, ...todos],
  };
};

const knowledgeRetrievalNode: AgentNode = (state) => {
  const targets = [
    "基础信息",
    "importMaps",
    "nodeUIDL",
    "resources",
    "observerDataSources",
    "flows/containers",
  ];

  const notes = targets.map((section) => `${section}: ${KNOWLEDGE_RETRIEVAL_PROMPT}`);

  return {
    ...state,
    retrievalPlan: {
      targets,
      notes,
    },
  };
};

const editPlanNode: AgentNode = (state) => {
  const editPlan: EditPlanItem[] = [];

  (state.todos ?? []).forEach((todo) => {
    editPlan.push({
      description: `${EDIT_PLAN_PROMPT}\nTodo: ${todo}`,
    });
  });

  const suggestions = buildSuggestions(state, editPlan);

  const updatedUIDL: UIDLDocument = {
    ...state.uidl,
    agentNotes: {
      understanding: state.understanding,
      todos: state.todos,
      retrievalPlan: state.retrievalPlan,
      editPlan,
    },
  };

  return {
    ...state,
    editPlan,
    suggestions,
    updatedUIDL,
  };
};

function buildSuggestions(state: AgentState, editPlan: EditPlanItem[]): string[] {
  const suggestions: string[] = [];

  if (state.understanding) {
    suggestions.push(`需求理解: ${state.understanding}`);
  }

  if (state.retrievalPlan) {
    suggestions.push(
      `知识检索聚焦: ${state.retrievalPlan.targets.join(", ")}. 缺口提示: ${state.retrievalPlan.notes.join(" | ")}`,
    );
  }

  if (editPlan.length > 0) {
    suggestions.push(
      `编辑计划: ${editPlan
        .map((item, index) => `(${index + 1}) ${item.description}${item.targetPath ? ` @ ${item.targetPath}` : ""}`)
        .join("; ")}`,
    );
  }

  if (!suggestions.length) {
    suggestions.push("暂无修改建议，等待更多上下文。");
  }

  return suggestions;
}

function trimmedLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function createAgent(logger: AgentLogger = createLogger()) {
  const graph = new StateGraph<AgentState>({});

  graph.addNode("requirementUnderstanding", withErrorHandling("需求理解", logger, requirementUnderstandingNode));
  graph.addNode("todoBreakdown", withErrorHandling("Todo拆解", logger, todoBreakdownNode));
  graph.addNode("knowledgeRetrieval", withErrorHandling("知识检索", logger, knowledgeRetrievalNode));
  graph.addNode("editPlanner", withErrorHandling("编辑计划", logger, editPlanNode));

  graph.addEdge(START, "requirementUnderstanding");
  graph.addEdge("requirementUnderstanding", "todoBreakdown");
  graph.addEdge("todoBreakdown", "knowledgeRetrieval");
  graph.addEdge("knowledgeRetrieval", "editPlanner");
  graph.addEdge("editPlanner", END);

  const compiled = graph.compile();

  return {
    async run(input: AgentInput): Promise<AgentResult> {
      const result = await compiled.invoke({ ...input });
      return {
        updatedUIDL: result.updatedUIDL,
        suggestions: result.suggestions,
        errors: result.errors,
      };
    },
  };
}

export async function runAgent(input: AgentInput): Promise<AgentResult> {
  const agent = createAgent();
  return agent.run(input);
}

export default runAgent;
