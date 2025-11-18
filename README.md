# uidl_agent

基于 UIDL 的轻量 Agent，能够理解需求、拆解 TODO 并对 UIDL JSON 进行二次开发。

## 功能概述
- **六大板块感知**：自动识别页面基础信息、依赖、节点树、资源、数据源、流程编排。
- **需求拆解**：根据自然语言需求生成待办列表并指向对应 JSON 区域。
- **可编排修改**：提供 `mutator` 钩子，可与 LangChain / LangGraph 流程结合，对特定板块进行增量修改。
- **示例数据**：`samples/page.json` 复刻了一个真实的页面 UIDL，便于验证推理链路。

## 快速开始
```bash
# 运行示例，读取 samples/page.json 并输出 TODO 计划
python uidl_agent/agent.py
```

`UIDLAgent` 的核心接口如下：
- `UIDLAgent.create_todo(requirement: str)`：根据需求生成与六大板块对应的 todo 列表。
- `UIDLAgent.propose_patch(requirement: str, mutators: Dict[str, Callable])`：按需执行 mutator，并返回修改后的 UIDL 与执行记录。
- `UIDLAgent.from_json_file(path: Path)`：从 JSON 文件加载 UIDL。

可以在调用 `propose_patch` 时传入自定义 mutator，例如：
```python
agent = UIDLAgent.from_json_file(Path("samples/page.json"))
def tweak_node(node):
    node["debug"] = True
    return node
result = agent.propose_patch("调整表单", {"nodeUIDL": tweak_node})
```

本项目不直接依赖 LangChain / LangGraph，但所有接口均为函数式设计，便于嵌入到链路或有向图节点中。
