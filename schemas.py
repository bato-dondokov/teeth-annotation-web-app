"""
Pydantic‑схемы (DTO) для API.
Описывают структуры данных:
- ролей и пользователей (создание, публичное и приватное представления);
- JWT‑токена;
- запроса на сохранение аннотации.
"""
from pydantic import BaseModel, ConfigDict, Field


class RoleBase(BaseModel):
    name: str
    name_ru: str
    password: str

class RoleResponse(RoleBase):
    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    name: str
    role: str

class UserCreate(UserBase):
    phone_number: str

class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: str

class UserPrivate(UserPublic):
    phone_number: str
    progress: int
    current_tooth: int
    range_start: int
    range_end: int

class Token(BaseModel):
    access_token: str
    token_type: str

class AnnotationRequest(BaseModel):
    condition: int
    pathology: int
    recommendation: int
    term: int