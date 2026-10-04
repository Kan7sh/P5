// All panel text lives here. Everything below is PLACEHOLDER copy — replace with your real details.
export const LINKS = {
  allProjects: "https://projects.kanishc.in/",
  resume: "https://drive.google.com/file/d/1oK0atZ7ir3R84dw4jEaqWoaAoH5lLC46", 
};

export const PROJECTS = [
  { title: "Layer Flow", year: "2025", tag: "AI based image editing ", href: "https://layerflow.kanishc.in/",
    desc: "Built an open-source, AI-powered image editor with a modern, responsive UI and a full layer-based workspace for precise text and image manipulation. Integrated a LangChain-powered AI assistant to generate images, remove backgrounds, create text layers, and automate complex or repetitive editing workflows.",
    stack: ["NEXT.JS", "REACT.JS", "LANGCHAIN", "GEN AI"], image: "/assets/projects/layerflow.png" },
  { title: "Code Compass", year: "2024", tag: "Auto code review", href: "https://codecompass.kanishc.in/",
    desc: "Built an AI-powered GitHub code review tool that automatically tracks pull requests and analyzes code changes using Hugging Face models. Generates fast, context-aware, and constructive review feedback to reduce review delays and improve overall code quality.",
    stack: ["NEXT.JS", "REACT.JS", "TYPESCRIPT", "GEN AI"], image: "/assets/projects/codecompass.png" },
  { title: "AI Alarm", year: "2023", tag: "AI alarm mobile app", href: "https://drive.google.com/file/d/1P44Njcd1oVqZPe7jpTaBGz8QCb2DGiN5/view",
    desc: "Built an AI-powered alarm app that requires users to physically locate and capture a specific object to dismiss the alarm, encouraging active engagement and movement. Implemented image-based object recognition alongside recurring alarms, customizable ringtones, and scheduling features to create a practical and interactive wake-up experience.",
    stack: ["KOTLIN", "TENSORFLOW"], image: "/assets/projects/aialarm.jpg" },
];

export const EXPERIENCE = [
  { role: "Full Stack Developer", org: "Tata Consultancy Services", period: "Jan 2025 — PRES",
    desc: "Developed and maintained Spring Boot microservices and React-based UIs for Vodafone’s CRM Agent Portal, supporting 20,000+ daily customer operations and 3,000+ CRM agents across key workflows. Integrated LLM-based RAG pipelines with vector search for context-aware CRM knowledge retrieval, while leveraging Kafka, Redis, Docker, and Kubernetes for scalable event processing, optimized APIs, and end-to-end deployments.",
    stack: ["LLM, RAG INTEGRATION", "SPRING BOOT", "REACT","KAFKA"] },
  { role: "Software Developer", org: "L&G Consultancy", period: "Jan 2024 — Jan 2025",
    desc: "Designed and built a cloud-native payment mandate microservice using Azure Functions (C#), Event Grid, and QLink APIs for South African banks, streamlining mandate processing and reducing manual effort by 40%. Led the migration of the order module for the Steve Madden website from .NET 4.8 to .NET 8, integrating callback APIs, improving data consistency, and reducing response time by 30%. Revamped the employee rating platform using React and Zustand, reducing the page load time by 50%.",
    stack: [".NET", "REACT", "AZURE"] },
  { role: "Flutter Developer Intern", org: "Ridobiko", period: "Jul 2023 — Dec 2023",
    desc: "Delivered two end-to-end cross-platform Flutter apps for customers and vendors, enabling subscription management, cleaning-service scheduling, and operational workflows. Integrated Razorpay payments, Firebase, background services, and Riverpod for state management and real-time updates, achieving 99.9% crash-free sessions.",
    stack: ["FLUTTER", "DART", "REST", "FIREBASE"] },
];

export const EDUCATION = [
  { role: "B.Tech in Computer Science and Engineering", org: "Punjab Technical University", period: "2020 — 2024", desc: "8.3 GPA" },
];

export const YEARS = "3.3";
export const UPDATED = "OCT 2026";

export const PAGES = {
  movies: "https://letterboxd.com/Kan7sh",      
  lifting: "https://hevy.com/user/kan7sh",   
};
