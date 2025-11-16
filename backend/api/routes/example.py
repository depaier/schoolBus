from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_examples():
    """예제 데이터 조회"""
    return {
        "data": [
            {"id": 1, "name": "Example 1"},
            {"id": 2, "name": "Example 2"},
        ]
    }


@router.get("/{item_id}")
async def get_example(item_id: int):
    """특정 예제 데이터 조회"""
    return {"id": item_id, "name": f"Example {item_id}"}
