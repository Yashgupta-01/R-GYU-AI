// Topic Generator for the AI Courtroom Debate Simulator

const DEBATE_TOPICS = [
  { topic: "Universal Basic Income (UBI)", category: "Economy" },
  { topic: "Banning Private Vehicles in Major Cities", category: "Society" },
  { topic: "Replacing Traditional College Degrees with Skills Badges", category: "Society" },
  { topic: "AI-generated Art Deserves Copyright Protection", category: "Ethics" },
  { topic: "Establishing a Permanent Human Settlement on Mars by 2040", category: "Tech" },
  { topic: "Should Social Media Algorithms be Publicly Audited?", category: "Tech" },
  { topic: "Lab-Grown Meat Replacing Traditional Animal Agriculture", category: "Ethics" },
  { topic: "Banning Nuclear Power in the Transition to Clean Energy", category: "Economy" },
  { topic: "Should Companies be Legally Liable for Algorithmic Bias?", category: "Ethics" },
  { topic: "Implementing a Maximum Limit on Individual Wealth", category: "Economy" },
  { topic: "Facial Recognition Technology Banned in Public Spaces", category: "Tech" },
  { topic: "Should Voting be Legally Mandatory in Democratic Nations?", category: "Society" },
  { topic: "Is Virtual Reality Remote Work Superior to Physical Offices?", category: "Tech" },
  { topic: "Should We Gene-Edit Human Embryos to Eradicate Diseases?", category: "Ethics" },
  { topic: "Imposing a Higher Carbon Tax on Carbon-Heavy Industries", category: "Economy" },
  { topic: "Should AI Agents be Granted Legal Personhood Status?", category: "Ethics" },
  { topic: "Should Internet Access be a Constitutionally Protected Human Right?", opacity: "Society", category: "Society" },
  { topic: "Are Cryptocurrencies a Viable Alternative to Fiat Currencies?", category: "Economy" },
  { topic: "Should Space Exploration Funding be Diverted to Climate Change?", category: "Society" },
  { topic: "Should Companies Limit Work Weeks to 4 Days for the Same Pay?", category: "Economy" },
  { topic: "Are Autonomous Self-Driving Cars Safer Than Human Drivers?", category: "Tech" },
  { topic: "Should Public Transportation be Free for All Citizens?", category: "Economy" },
  { topic: "Is Human Brain-Computer Interface (e.g. Neuralink) Safe for Society?", category: "Tech" },
  { topic: "Should Homework be Banned in Primary Education?", category: "Society" },
  { topic: "Should Facial Recognition be Allowed for Security at Airports?", category: "Tech" },
  { topic: "Should We Hold Tech Companies Accountable for Smartphone Addiction?", category: "Ethics" },
  { topic: "Should Government Subsidies for Fossil Fuels be Eliminated?", category: "Economy" },
  { topic: "Should Deepfakes and Synthetic Media Have Strict Watermarks?", category: "Tech" },
  { topic: "Is Nuclear Fusion a Practical Energy Goal for This Century?", category: "Tech" },
  { topic: "Should Citizens Have a Guaranteed Right to Disconnect After Work?", category: "Society" }
];

function getRandomTopic() {
  const index = Math.floor(Math.random() * DEBATE_TOPICS.length);
  return DEBATE_TOPICS[index];
}

function initTopicGenerator(inputElementId, diceButtonId, tagsContainerId) {
  const inputEl = document.getElementById(inputElementId);
  const btnEl = document.getElementById(diceButtonId);
  const tagsEl = document.getElementById(tagsContainerId);

  if (!inputEl || !btnEl || !tagsEl) return;

  const displayTopic = (topicObj) => {
    inputEl.value = topicObj.topic;
    tagsEl.innerHTML = "";
    
    const tag = document.createElement("span");
    tag.className = `topic-tag`;
    tag.textContent = topicObj.category;
    
    // Simple color-coding helper
    switch(topicObj.category) {
      case "Economy": tag.style.borderColor = "var(--plaintiff)"; tag.style.color = "var(--plaintiff)"; break;
      case "Tech": tag.style.borderColor = "var(--defendant)"; tag.style.color = "var(--defendant)"; break;
      case "Ethics": tag.style.borderColor = "var(--judge)"; tag.style.color = "var(--judge)"; break;
      case "Society": tag.style.borderColor = "var(--gold)"; tag.style.color = "var(--gold)"; break;
    }
    
    tagsEl.appendChild(tag);
  };

  btnEl.addEventListener("click", () => {
    const topic = getRandomTopic();
    displayTopic(topic);
  });

  // Render a random one on startup
  displayTopic(getRandomTopic());
}
