import os
import subprocess

os.environ['CUDA_HOME'] = 'C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA\\v13.0'
subprocess.run(['C:\\Users\\agniv\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe', 'C:\\Users\\agniv\\nextjs\\services\\ag3d-converter\\ag3d_repo\\setup.py', 'build', 'develop'])
