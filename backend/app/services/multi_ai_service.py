import os
from abc import ABC, abstractmethod
from typing import Dict, List

from dotenv import load_dotenv
from langchain.memory import ConversationBufferMemory

# LangChain 导入
from langchain.schema import AIMessage, HumanMessage, SystemMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings

load_dotenv()


class BaseAIService(ABC):
    """AI 服务基类"""

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]]) -> str:
        """发送聊天消息"""
        pass

    @abstractmethod
    async def analyze_report(self, content: str) -> str:
        """分析医疗报告"""
        pass


class OpenAIService(BaseAIService):
    """OpenAI 服务"""

    def __init__(self):
        from langchain_openai import ChatOpenAI
        self.llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.7,
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            openai_api_base=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        try:
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))

            response = await self.llm.ainvoke(langchain_messages)
            return response.content
        except Exception as e:
            return f"OpenAI 服务错误：{e!s}"

    async def analyze_report(self, content: str) -> str:
        analysis_prompt = f"""
        请分析以下医疗报告内容，并提供专业的解读和建议：

        报告内容：
        {content}

        请从以下方面进行分析：
        1. 报告类型和主要指标
        2. 异常值的识别
        3. 可能的健康风险
        4. 建议的后续检查
        5. 生活方式建议

        注意：这只是初步分析，最终诊断需要专业医生确认。
        """

        try:
            response = await self.llm.ainvoke([HumanMessage(content=analysis_prompt)])
            return response.content
        except Exception as e:
            return f"报告分析失败：{e!s}"


class DeepSeekService(BaseAIService):
    """DeepSeek 服务"""

    def __init__(self):
        from langchain_openai import ChatOpenAI
        self.llm = ChatOpenAI(
            model="deepseek-chat",
            temperature=0.7,
            openai_api_key=os.getenv("DEEPSEEK_API_KEY"),
            openai_api_base=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
        )

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        try:
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))

            response = await self.llm.ainvoke(langchain_messages)
            return response.content
        except Exception as e:
            return f"DeepSeek 服务错误：{e!s}"

    async def analyze_report(self, content: str) -> str:
        analysis_prompt = f"""
        请分析以下医疗报告内容，并提供专业的解读和建议：

        报告内容：
        {content}

        请从以下方面进行分析：
        1. 报告类型和主要指标
        2. 异常值的识别
        3. 可能的健康风险
        4. 建议的后续检查
        5. 生活方式建议

        注意：这只是初步分析，最终诊断需要专业医生确认。
        """

        try:
            response = await self.llm.ainvoke([HumanMessage(content=analysis_prompt)])
            return response.content
        except Exception as e:
            return f"报告分析失败：{e!s}"


class AnthropicService(BaseAIService):
    """Anthropic (Claude) 服务"""

    def __init__(self):
        from langchain_anthropic import ChatAnthropic
        self.llm = ChatAnthropic(
            model="claude-3-sonnet-20240229",
            temperature=0.7,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        try:
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))

            response = await self.llm.ainvoke(langchain_messages)
            return response.content
        except Exception as e:
            return f"Anthropic 服务错误：{e!s}"

    async def analyze_report(self, content: str) -> str:
        analysis_prompt = f"""
        请分析以下医疗报告内容，并提供专业的解读和建议：

        报告内容：
        {content}

        请从以下方面进行分析：
        1. 报告类型和主要指标
        2. 异常值的识别
        3. 可能的健康风险
        4. 建议的后续检查
        5. 生活方式建议

        注意：这只是初步分析，最终诊断需要专业医生确认。
        """

        try:
            response = await self.llm.ainvoke([HumanMessage(content=analysis_prompt)])
            return response.content
        except Exception as e:
            return f"报告分析失败：{e!s}"


class KimiService(BaseAIService):
    """Kimi 服务 (通过 Moonshot API)"""

    def __init__(self):
        from langchain_openai import ChatOpenAI
        self.llm = ChatOpenAI(
            model="moonshot-v1-8k",
            temperature=0.7,
            openai_api_key=os.getenv("KIMI_API_KEY"),
            openai_api_base=os.getenv("KIMI_BASE_URL", "https://api.moonshot.cn/v1")
        )

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        try:
            langchain_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    langchain_messages.append(SystemMessage(content=msg["content"]))
                elif msg["role"] == "user":
                    langchain_messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    langchain_messages.append(AIMessage(content=msg["content"]))

            response = await self.llm.ainvoke(langchain_messages)
            return response.content
        except Exception as e:
            return f"Kimi 服务错误：{e!s}"

    async def analyze_report(self, content: str) -> str:
        analysis_prompt = f"""
        请分析以下医疗报告内容，并提供专业的解读和建议：

        报告内容：
        {content}

        请从以下方面进行分析：
        1. 报告类型和主要指标
        2. 异常值的识别
        3. 可能的健康风险
        4. 建议的后续检查
        5. 生活方式建议

        注意：这只是初步分析，最终诊断需要专业医生确认。
        """

        try:
            response = await self.llm.ainvoke([HumanMessage(content=analysis_prompt)])
            return response.content
        except Exception as e:
            return f"报告分析失败：{e!s}"


class MockAIService(BaseAIService):
    """模拟 AI 服务（用于测试或离线模式）"""

    def __init__(self):
        self.medical_responses = [
            "根据您描述的症状，建议您咨询专业医生进行详细检查。",
            "这些症状可能与多种疾病相关，需要进一步的医学检查来确定具体原因。",
            "保持良好的生活习惯，包括规律作息、均衡饮食和适量运动。",
            "如果症状持续或加重，请及时就医。",
            "建议您进行相关的医学检查，如血液检查、影像学检查等。"
        ]

    async def chat(self, messages: List[Dict[str, str]]) -> str:
        import random
        return random.choice(self.medical_responses)

    async def analyze_report(self, content: str) -> str:
        return f"""
        模拟报告分析结果：

        报告内容摘要：{content[:100]}...

        分析建议：
        1. 建议咨询专业医生进行详细解读
        2. 根据检查结果制定相应的治疗方案
        3. 定期进行健康检查
        4. 保持良好的生活习惯

        注意：这是模拟分析结果，实际应用需要真实的 AI 模型。
        """


class MultiAIService:
    """多模型 AI 服务管理器"""

    def __init__(self):
        self.model_type = os.getenv("AI_MODEL", "openai").lower()
        # 只有在非 mock 模式下才初始化 embeddings
        if self.model_type != "mock":
            try:
                self.embeddings = OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
            except Exception as e:
                print(f"Embeddings 初始化失败：{e!s}")
                self.embeddings = None
        else:
            self.embeddings = None
        self.memories: Dict[int, ConversationBufferMemory] = {}
        self.vector_store = None

        # 初始化对应的 AI 服务
        if self.model_type == "openai":
            self.ai_service = OpenAIService()
        elif self.model_type == "deepseek":
            self.ai_service = DeepSeekService()
        elif self.model_type == "anthropic":
            self.ai_service = AnthropicService()
        elif self.model_type == "kimi":
            self.ai_service = KimiService()
        else:
            print(f"未知的模型类型: {self.model_type}，使用模拟服务")
            self.ai_service = MockAIService()

    def get_memory(self, user_id: int) -> ConversationBufferMemory:
        if user_id not in self.memories:
            self.memories[user_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            )
        return self.memories[user_id]

    def create_medical_context(self) -> str:
        return """你是一个专业的医疗AI助手，具有以下特点：
        1. 提供准确的医疗信息和建议
        2. 始终提醒用户咨询专业医生
        3. 不提供具体的诊断，只提供一般性信息
        4. 保持专业、谨慎的态度
        5. 对于紧急情况，建议立即就医

        请记住：你的建议不能替代专业医疗诊断。"""

    async def chat(self, user_id: int, message: str, context: List[Dict] = None) -> str:
        # 构建消息列表
        messages = [{"role": "system", "content": self.create_medical_context()}]

        # 添加上下文信息
        if context:
            for item in context:
                messages.append({"role": item["role"], "content": item["content"]})

        # 添加当前消息
        messages.append({"role": "user", "content": message})

        # 调用对应的 AI 服务
        return await self.ai_service.chat(messages)

    async def analyze_report(self, file_content: str, file_type: str) -> str:
        return await self.ai_service.analyze_report(file_content)

    def process_document(self, file_path: str, file_type: str) -> str:
        """处理上传的文档"""
        try:
            if file_type == "pdf":
                loader = PyPDFLoader(file_path)
            elif file_type == "docx":
                loader = Docx2txtLoader(file_path)
            else:
                return "不支持的文件格式"

            documents = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            texts = text_splitter.split_documents(documents)

            # 提取文本内容
            content = "\n".join([doc.page_content for doc in texts])
            return content

        except Exception as e:
            return f"文档处理失败：{e!s}"

    def update_vector_store(self, documents: List[str]):
        """更新向量数据库"""
        try:
            if documents and self.embeddings:
                # 创建向量存储
                self.vector_store = FAISS.from_texts(documents, self.embeddings)
            elif documents and not self.embeddings:
                print("Embeddings 未初始化，跳过向量数据库更新")
        except Exception as e:
            print(f"向量数据库更新失败：{e!s}")

    def get_model_info(self) -> Dict[str, str]:
        """获取当前模型信息"""
        return {
            "model_type": self.model_type,
            "status": "active" if self.ai_service else "inactive"
        }


# 全局 AI 服务实例
ai_service = MultiAIService()
