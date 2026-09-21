from pydantic import BaseModel,Field
class AuthSchema(BaseModel): nickname:str=Field(min_length=3,max_length=32); password:str=Field(min_length=4,max_length=128)
