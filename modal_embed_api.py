import modal
from pydantic import BaseModel
from typing import List, Dict

# تعريف التطبيق في Modal
app = modal.App("zad-embedding-service-bge-m3")

# تعريف البيئة (Image) التي سيعمل عليها الكود في السحابة
# نقوم بتثبيت المكتبات المطلوبة للنموذج
image = (
    modal.Image.debian_slim()
    .pip_install("FlagEmbedding", "torch", "fastapi")
)

# هياكل البيانات للطلب والاستجابة
class EmbeddingRequest(BaseModel):
    texts: List[str]

class EmbeddingResponse(BaseModel):
    results: List[Dict]

# تعريف السيرفر (Class) الذي سيحمل النموذج في الذاكرة
@app.cls(image=image, gpu="T4")
class BGEM3ModalService:
    @modal.enter()
    def load_model(self):
        # هذه الدالة تعمل مرة واحدة فقط عند إقلاع السيرفر لتحميل النموذج في رامات الـ GPU
        from FlagEmbedding import BGEM3FlagModel
        print("Loading BGE-M3 model...")
        # هنا Modal هو من سيقوم بتحميل 4.5 جيجا من HuggingFace بسرعة خرافية، وليس الإنترنت الخاص بك!
        self.model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
        print("Model loaded successfully on Modal.")

    @modal.fastapi_endpoint(method="POST")
    def embed(self, request: EmbeddingRequest) -> EmbeddingResponse:
        # هذه الدالة تستقبل النصوص وترجع الـ Vectors
        output = self.model.encode(
            request.texts,
            return_dense=True,
            return_sparse=True,
            return_colbert_vecs=False,
            batch_size=len(request.texts)
        )
        
        results = []
        for dense, sparse in zip(output['dense_vecs'].tolist(), output['lexical_weights']):
            # تحويل القيم من numpy.float16 إلى float العادي حتى يتمكن FastAPI من إرسالها كـ JSON
            clean_sparse = {k: float(v) for k, v in sparse.items()}
            results.append({
                "dense": dense,
                "sparse": clean_sparse
            })
        return EmbeddingResponse(results=results)
