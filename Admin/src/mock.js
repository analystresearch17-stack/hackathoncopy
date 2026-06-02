export const HACKATHON_CONFIG = {
  name: "GenAI for Good 2025",
  organiser: "Google DeepMind",
  tagline: "Build AI-powered solutions for real-world social challenges.",
  theme: "AI / ML",
  prize_pool: "$25,000",
  max_team_size: 4,
  registration_deadline: "2025-08-20T23:59:00",
  hackathon_start: "2025-09-01T09:00:00",
  hackathon_end: "2025-09-03T23:59:00",
  submission_deadline: "2025-09-03T23:59:00",
  results_date: "2025-09-15",
  registration_open: true,
  resources_visible: true,
  submissions_open: true,
};

export const PARTICIPANTS = [
  { id:1, name:"Priya Sharma", enterprise_id:"EMP-00214", email:"priya@company.com", primary_skill:"ML / AI", member_type:"Employee", participation_type:"team", project_name:"AI HR Assistant", project_lead:"Priya Sharma", registered_at:"2025-08-10T09:20:00",
    team_members:[{name:"Rahul Nair",enterprise_id:"EMP-00318",primary_skill:"Backend"},{name:"Sneha Kapoor",enterprise_id:"EMP-00422",primary_skill:"Design / UX"}]
  },
  { id:2, name:"Kabir Mehta", enterprise_id:"EMP-00109", email:"kabir@company.com", primary_skill:"Backend", member_type:"Employee", participation_type:"solo", project_name:"FinSight", project_lead:"Kabir Mehta", registered_at:"2025-08-11T11:00:00", team_members:[] },
  { id:3, name:"Ananya Iyer", enterprise_id:"EMP-00531", email:"ananya@company.com", primary_skill:"Frontend", member_type:"Employee", participation_type:"team", project_name:"ClimateAI", project_lead:"Ananya Iyer", registered_at:"2025-08-11T14:30:00",
    team_members:[{name:"Dev Patel",enterprise_id:"EMP-00612",primary_skill:"ML / AI"},{name:"Riya Singh",enterprise_id:"EMP-00715",primary_skill:"Data science"},{name:"Arjun Das",enterprise_id:"EMP-00819",primary_skill:"DevOps"}]
  },
  { id:4, name:"Vikram Rao", enterprise_id:"EMP-00247", email:"vikram@company.com", primary_skill:"Data science", member_type:"Contractor", participation_type:"solo", project_name:"SafeRoute", project_lead:"Vikram Rao", registered_at:"2025-08-12T08:00:00", team_members:[] },
  { id:5, name:"Meera Nambiar", enterprise_id:"EMP-00388", email:"meera@company.com", primary_skill:"Product", member_type:"Employee", participation_type:"team", project_name:"MediAssist", project_lead:"Meera Nambiar", registered_at:"2025-08-13T10:15:00",
    team_members:[{name:"Siddharth Kumar",enterprise_id:"EMP-00491",primary_skill:"Frontend"}]
  },
  { id:6, name:"Nikhil Joshi", enterprise_id:"EMP-00156", email:"nikhil@company.com", primary_skill:"DevOps", member_type:"Intern", participation_type:"solo", project_name:"AgriSense", project_lead:"Nikhil Joshi", registered_at:"2025-08-14T16:00:00", team_members:[] },
  { id:7, name:"Pooja Reddy", enterprise_id:"EMP-00627", email:"pooja@company.com", primary_skill:"ML / AI", member_type:"Employee", participation_type:"team", project_name:"EduPath", project_lead:"Pooja Reddy", registered_at:"2025-08-15T09:00:00",
    team_members:[{name:"Arun Menon",enterprise_id:"EMP-00733",primary_skill:"Backend"},{name:"Divya Shah",enterprise_id:"EMP-00841",primary_skill:"Data science"}]
  },
  { id:8, name:"Rohan Verma", enterprise_id:"EMP-00072", email:"rohan@company.com", primary_skill:"Frontend", member_type:"Employee", participation_type:"solo", project_name:"SupplyBot", project_lead:"Rohan Verma", registered_at:"2025-08-16T13:45:00", team_members:[] },
];

export const SUBMISSIONS = [
  { id:1, participant_id:1, project_title:"AI HR Assistant", description:"Automates employee onboarding and HR queries using a fine-tuned LLM.", github_url:"https://github.com/team/ai-hr", demo_url:"https://demo.aihr.app", deck_filename:"ai_hr_deck.pptx", status:"submitted", submitted_at:"2025-09-03T10:42:00" },
  { id:2, participant_id:2, project_title:"FinSight", description:"AI-powered personal finance assistant with anomaly detection.", github_url:"https://github.com/kabir/finsight", demo_url:"", deck_filename:"", status:"draft", submitted_at:null },
  { id:3, participant_id:3, project_title:"ClimateAI", description:"Predicts urban heat islands using satellite imagery and ML models.", github_url:"https://github.com/team/climateai", demo_url:"", deck_filename:"climateai_deck.pptx", status:"submitted", submitted_at:"2025-09-02T15:18:00" },
  { id:4, participant_id:5, project_title:"MediAssist", description:"AI triage assistant that suggests urgency levels from patient symptom inputs.", github_url:"https://github.com/team/mediassist", demo_url:"https://mediassist.demo", deck_filename:"mediassist_deck.pptx", status:"submitted", submitted_at:"2025-09-03T08:05:00" },
  { id:5, participant_id:7, project_title:"EduPath", description:"Adaptive learning path generator using student performance data.", github_url:"https://github.com/team/edupath", demo_url:"", deck_filename:"", status:"draft", submitted_at:null },
  { id:6, participant_id:8, project_title:"SupplyBot", description:"Demand forecasting tool for SME supply chains using time-series models.", github_url:"https://github.com/rohan/supplybot", demo_url:"", deck_filename:"supplybot_deck.pdf", status:"submitted", submitted_at:"2025-09-03T23:33:00" },
];

export const ADMIN_CREDENTIALS = { username:"admin", password:"admin123" };

export const RESOURCE_FILES = [
  { filename:"problem_statement.pdf", type:"PDF", size:"1.2 MB", uploaded:"10 Aug" },
  { filename:"guidelines.pdf", type:"PDF", size:"0.8 MB", uploaded:"10 Aug" },
  { filename:"submission_template.pptx", type:"PPTX", size:"3.4 MB", uploaded:"12 Aug" },
  { filename:"evaluation_criteria.pdf", type:"PDF", size:"0.5 MB", uploaded:"12 Aug" },
];
