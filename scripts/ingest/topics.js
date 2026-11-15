// Issue topics a young voter recognises. A question gets a topic when its
// ministry is in the topic's list or its subject line matches the keywords.
// The rules are published on the methodology page.

export const TOPICS = [
  { slug: "education", label: "Exams & education", blurb: "Schools, colleges, entrance exams and scholarships.",
    ministries: ["EDUCATION"], keywords: /\b(neet|jee|cuet|exam|school|college|universit|scholarship|education|ugc|ncert)/i },
  { slug: "jobs", label: "Jobs", blurb: "Employment, skills, wages and recruitment.",
    ministries: ["LABOUR AND EMPLOYMENT", "SKILL DEVELOPMENT AND ENTREPRENEURSHIP"], keywords: /\b(job|employment|unemploy|recruit|vacanc|skill|wage|mgnrega|apprentice)/i },
  { slug: "farming", label: "Farming", blurb: "Crops, MSP, farmers' incomes, fisheries and dairy.",
    ministries: ["AGRICULTURE AND FARMERS WELFARE", "FISHERIES, ANIMAL HUSBANDRY AND DAIRYING", "FOOD PROCESSING INDUSTRIES"], keywords: /\b(farmer|crop|msp|agricultur|fertili[sz]er|kisan|irrigation)/i },
  { slug: "health", label: "Health", blurb: "Hospitals, medicines, insurance and public health.",
    ministries: ["HEALTH AND FAMILY WELFARE", "AYUSH"], keywords: /\b(health|hospital|medic|doctor|disease|ayushman|vaccin|cancer)/i },
  { slug: "railways", label: "Railways", blurb: "Trains, stations, fares and safety.",
    ministries: ["RAILWAYS"], keywords: /\b(railway|train|station|vande bharat)/i },
  { slug: "womens-safety", label: "Women's safety", blurb: "Crimes against women, protection and support schemes.",
    ministries: ["WOMEN AND CHILD DEVELOPMENT"], keywords: /\b(women|woman|girl|dowry|sexual|harassment|rape|domestic violence)/i },
  { slug: "environment", label: "Climate & environment", blurb: "Pollution, forests, wildlife and climate change.",
    ministries: ["ENVIRONMENT, FOREST AND CLIMATE CHANGE", "NEW AND RENEWABLE ENERGY"], keywords: /\b(pollution|climate|forest|wildlife|emission|air quality|renewable|solar)/i },
  { slug: "roads", label: "Roads", blurb: "Highways, rural roads and road safety.",
    ministries: ["ROAD TRANSPORT AND HIGHWAYS"], keywords: /\b(highway|road|expressway|toll)/i },
  { slug: "internet", label: "Internet & telecom", blurb: "Mobile networks, broadband and digital services.",
    ministries: ["COMMUNICATIONS", "ELECTRONICS AND INFORMATION TECHNOLOGY"], keywords: /\b(internet|broadband|telecom|mobile network|5g|4g|digital|cyber)/i },
  { slug: "water", label: "Water", blurb: "Drinking water, rivers, floods and droughts.",
    ministries: ["JAL SHAKTI"], keywords: /\b(water|river|flood|drought|groundwater|jal jeevan)/i },
  { slug: "prices", label: "Prices & inflation", blurb: "Inflation, fuel and food prices, and taxes on everyday goods.",
    ministries: ["CONSUMER AFFAIRS, FOOD AND PUBLIC DISTRIBUTION"], keywords: /\b(inflation|price|gst|fuel|petrol|diesel|lpg)/i },
  { slug: "defence", label: "Defence", blurb: "Armed forces, veterans and national security.",
    ministries: ["DEFENCE"], keywords: /\b(army|navy|air force|defence|soldier|veteran|agniveer|border)/i },
  { slug: "sport", label: "Sport", blurb: "Athletes, facilities and sporting events.",
    ministries: ["YOUTH AFFAIRS AND SPORTS"], keywords: /\b(sport|athlete|olympic|stadium|khelo india)/i },
  { slug: "startups", label: "Startups & business", blurb: "Startups, small businesses and credit.",
    ministries: ["MICRO, SMALL AND MEDIUM ENTERPRISES"], keywords: /\b(startup|start-up|msme|entrepreneur|small business)/i },
  { slug: "housing", label: "Housing & cities", blurb: "Affordable housing, urban services and city infrastructure.",
    ministries: ["HOUSING AND URBAN AFFAIRS"], keywords: /\b(housing|awas|urban|smart city|metro)/i },
];

export function tagTopics({ ministry, subject }) {
  const m = String(ministry ?? "").toUpperCase().trim();
  const s = String(subject ?? "");
  return TOPICS.filter((t) => t.ministries.includes(m) || (s && t.keywords.test(s))).map((t) => t.slug);
}
