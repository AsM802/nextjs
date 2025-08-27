from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def read_root():
    return {"message": "Welcome to the AG3D Converter Service!"}

@app.post("/convert-image-to-3d")
async def convert_image_to_3d():
    # Placeholder for AG3D integration
    return {"message": "Image conversion to 3D is not yet implemented."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
