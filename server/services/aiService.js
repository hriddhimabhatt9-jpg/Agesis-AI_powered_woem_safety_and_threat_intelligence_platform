import config from '../config/index.js';

const THREAT_DB = {
  threat: ['kill','die','hurt','attack','stalk','follow','watch you','find you','gun','knife','bomb','beat','punch','slap','burn','destroy','murder','strangle','choke','poison','acid','rape','assault'],
  manipulation: ['nobody else','only me','you owe','belong to me','cant live without','my property','youre nothing','no one will believe','crazy','imagining things','making it up','too sensitive','overreacting','your fault','deserve this','made me do','if you leave','without me youre','i own you','controlling'],
  harassment: ['ugly','slut','whore','bitch','send pics','send nudes','send photos','expose you','leak your','post your','share your pics','fat','disgusting','worthless','useless','pathetic','stupid','dumb'],
  grooming: ['our secret','dont tell','special bond','mature for your age','only one who understands','trust me','age is just','between us','no one needs to know','youre different','ive never felt this','soul connection'],
  stalking: ['watching you','outside your','followed you','know where you','saw you at','your schedule','your routine','tracking','surveillance','camera','installed','monitoring','checking your','hacked your'],
  blackmail: ['tell everyone','show everyone','send to your','your boss will','your family will','unless you','or else','consequences','regret','pay me','i have your','screenshots of','recorded','video of you'],
};

function analyzeText(text) {
  const lower = text.toLowerCase().replace(/['']/g, '');
  let score = 0; const patterns = []; let cats = {};
  for (const [cat, words] of Object.entries(THREAT_DB)) {
    let catScore = 0;
    words.forEach(w => {
      if (lower.includes(w)) { catScore += cat === 'threat' ? 25 : cat === 'blackmail' ? 22 : 18; patterns.push(`${cat}: "${w}"`); }
    });
    cats[cat] = catScore; score += catScore;
  }
  score = Math.min(score, 100);
  const topCat = Object.entries(cats).sort((a,b) => b[1]-a[1])[0];
  const category = topCat[1] > 0 ? topCat[0] : 'safe';
  const riskLevel = score >= 75 ? 'critical' : score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';
  return { score, patterns, category, riskLevel };
}

class AIService {
  constructor() { this.apiKey = config.openai.apiKey; this.baseUrl = 'https://api.openai.com/v1/chat/completions'; }

  async callOpenAI(messages, opts = {}) {
    if (!this.apiKey || this.apiKey.startsWith('your-')) return null;
    try {
      const r = await fetch(this.baseUrl, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${this.apiKey}`},
        body: JSON.stringify({model:opts.model||'gpt-3.5-turbo',messages,temperature:opts.temperature||0.7,max_tokens:opts.maxTokens||1000})});
      if(!r.ok) return null;
      const d=await r.json(); return d.choices[0].message.content;
    } catch { return null; }
  }

  async analyzeMessage(text) {
    const sysPrompt = `You analyze messages for threats. Return JSON: {"riskLevel":"low|medium|high|critical","riskScore":0-100,"category":"harassment|threat|manipulation|stalking|blackmail|safe","explanation":"...","detectedPatterns":["..."],"suggestedActions":["..."]}`;
    const aiResult = await this.callOpenAI([{role:'system',content:sysPrompt},{role:'user',content:`Analyze: "${text}"`}],{temperature:0.3});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    const a = analyzeText(text);
    const explanations = {
      threat: `This message contains direct threatening language with ${a.patterns.length} threat indicator(s). The sender is expressing violent intent or making intimidating statements. This is a serious safety concern that may warrant immediate action.`,
      manipulation: `This message shows psychological manipulation tactics. The sender is using ${a.patterns.length} manipulation technique(s) including emotional coercion, guilt-tripping, or controlling language designed to undermine your autonomy.`,
      harassment: `This message contains harassing content with ${a.patterns.length} abusive element(s). The language is demeaning, objectifying, or designed to cause emotional distress.`,
      grooming: `WARNING: This message shows ${a.patterns.length} grooming indicator(s). The sender appears to be building inappropriate trust, creating secrecy, or testing boundaries — classic predatory behavior patterns.`,
      stalking: `ALERT: This message contains ${a.patterns.length} stalking indicator(s). The sender demonstrates surveillance behavior, location tracking, or invasive monitoring of your activities.`,
      blackmail: `CRITICAL: This message contains ${a.patterns.length} blackmail/extortion indicator(s). The sender is threatening to expose information or demanding compliance under threat.`,
      safe: `This message appears relatively safe. No significant threat patterns were detected. However, always trust your instincts — context matters beyond what text analysis can capture.`,
    };
    const actions = {
      critical: ['Call emergency services (112) immediately','Block and report the sender','Save this as evidence in your vault','Share your location with trusted contacts','Do NOT engage further with the sender'],
      high: ['Save this message as evidence','Block the sender on all platforms','Report to platform administrators','Inform a trusted friend or family member','Consider filing a police report'],
      medium: ['Document this interaction','Monitor for escalation patterns','Set boundaries clearly','Discuss with someone you trust','Use the Escalation Tracker to monitor changes'],
      low: ['Stay aware and trust your instincts','No immediate action needed','Continue monitoring if interaction continues'],
    };
    return {riskLevel:a.riskLevel,riskScore:a.score,category:a.category,explanation:explanations[a.category],detectedPatterns:a.patterns.length?a.patterns:['No concerning patterns detected'],suggestedActions:actions[a.riskLevel]};
  }

  async decodeIntent(conversation) {
    const aiResult = await this.callOpenAI([{role:'system',content:'Decode psychological intent. Return JSON with riskLevel,riskScore,psychologicalIntent,detectedPatterns,explanation,suggestedActions,category'},{role:'user',content:conversation}],{temperature:0.3});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    const a = analyzeText(conversation);
    const lines = conversation.split('\n').filter(l=>l.trim());
    const intentMap = {
      grooming: {intent:'The conversation shows grooming behavior — the sender is systematically building false trust, creating emotional dependency, and establishing secrecy. This is a calculated pattern used by predators to isolate targets.',cat:'grooming'},
      manipulation: {intent:'Gaslighting and emotional manipulation detected. The sender is distorting reality, making you question your perceptions, and using guilt to maintain control. This is psychological abuse.',cat:'gaslighting'},
      stalking: {intent:'Obsessive monitoring behavior detected. The sender is tracking your movements, activities, or social connections in ways that violate your privacy and autonomy.',cat:'obsessive'},
      threat: {intent:'Direct intimidation and threatening behavior. The sender is using fear as a tool of control, making explicit or implicit threats to coerce compliance.',cat:'threatening'},
      blackmail: {intent:'Coercive control through threat of exposure. The sender is leveraging private information or images to force compliance — this is a criminal offense.',cat:'blackmail'},
      harassment: {intent:'Persistent degrading communication designed to demoralize and demean. This constitutes verbal/emotional abuse.',cat:'harassment'},
      safe: {intent:'No clear manipulative or threatening intent detected in this conversation. The communication appears normal, though context beyond text should always be considered.',cat:'safe'},
    };
    const i = intentMap[a.category] || intentMap.safe;
    return {riskLevel:a.riskLevel,riskScore:a.score,psychologicalIntent:i.intent,category:i.cat,explanation:`Analysis of ${lines.length} message(s) identified ${a.patterns.length} concerning pattern(s). ${i.intent}`,detectedPatterns:a.patterns.length?a.patterns:['No patterns detected'],suggestedActions:a.score>=50?['Cut off communication immediately','Save all conversation evidence','Report to authorities','Seek support from trusted people','Use AEGESIS evidence vault']:['Continue monitoring','Trust your instincts','Document if behavior changes']};
  }

  async checkEscalation(previousAnalyses) {
    const aiResult = await this.callOpenAI([{role:'system',content:'Analyze behavior escalation. Return JSON with riskLevel,riskScore,escalationDetected,escalationRate,explanation,predictedNextStep,suggestedActions,detectedPatterns'},{role:'user',content:JSON.stringify(previousAnalyses)}],{temperature:0.3});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    if(!previousAnalyses||previousAnalyses.length<2) return {riskLevel:'low',riskScore:15,escalationDetected:false,escalationRate:'insufficient-data',explanation:'Need at least 2 timeline entries to detect escalation patterns. Add more entries with dates to track behavior over time.',predictedNextStep:'Add more data points for accurate prediction',suggestedActions:['Add more conversation samples','Include dates for each entry','Track changes over at least 2-3 interactions'],detectedPatterns:['Insufficient data for analysis']};

    const scores = previousAnalyses.map((a,i)=>{const t=analyzeText(a.summary||a.text||'');return{idx:i,score:a.riskScore||t.score,date:a.date};});
    const first=scores[0].score,last=scores[scores.length-1].score;
    const trend=last-first;const avgScore=Math.round(scores.reduce((s,x)=>s+x.score,0)/scores.length);
    const escalating=trend>15;const rate=trend>40?'rapid':trend>20?'gradual':trend>0?'slight':'stable';
    const predictions={rapid:'The aggressor is likely to escalate to physical threats or direct confrontation within days. Immediate safety measures are critical.',gradual:'Behavior is slowly intensifying. Without intervention, this pattern typically escalates to direct threats within weeks.',slight:'Minor increase in intensity detected. While not alarming yet, this trajectory should be monitored closely.',stable:'No significant escalation detected. The behavior pattern remains consistent.'};
    return {riskLevel:avgScore>=60?'critical':avgScore>=40?'high':avgScore>=20?'medium':'low',riskScore:Math.min(avgScore+trend,100),escalationDetected:escalating,escalationRate:rate,explanation:`Analyzed ${scores.length} interactions. Risk trend: ${first}→${last} (${trend>0?'+':''}${trend}). ${escalating?'⚠️ ESCALATION DETECTED.':'Pattern appears stable.'}`,predictedNextStep:predictions[rate],suggestedActions:escalating?['Take immediate safety precautions','Alert trusted contacts now','Save all evidence','Consider involving law enforcement','Activate safety mode']:['Continue monitoring','Document all interactions','Stay alert for changes'],detectedPatterns:scores.map((s,i)=>`Entry ${i+1}: Risk score ${s.score}`)};
  }

  async scanDigitalShadow(query) {
    const aiResult = await this.callOpenAI([{role:'system',content:'Analyze digital exposure risks. Return JSON with riskLevel,riskScore,explanation,exposureData:{potentialRisks,protectionTips},suggestedActions,detectedPatterns'},{role:'user',content:query}],{temperature:0.5});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    const isEmail=query.includes('@'),isPhone=/\+?\d{10,}/.test(query);
    const riskData={
      email:{score:55,risks:['Email found in known data breach databases','May be linked to social media profiles via password recovery','Email metadata can reveal IP address and location','Used for phishing and social engineering attacks','Can be scraped from public websites and forums'],tips:['Enable 2-factor authentication on all accounts','Use unique passwords per service (use a password manager)','Check haveibeenpwned.com for known breaches','Use email aliases for public registrations','Regularly review account recovery options']},
      phone:{score:65,risks:['Phone numbers are linked to identity via SIM registration','Can be used for SIM-swap attacks to bypass 2FA','Exposed in data breaches and telemarketer databases','Reverse lookup can reveal name and address','WhatsApp/Telegram may expose profile photo and status'],tips:['Never share OTPs with anyone','Enable SIM lock with your carrier','Use virtual numbers for online registrations','Review privacy settings on WhatsApp/Telegram','Be cautious of calls asking for personal info']},
      username:{score:45,risks:['Same username across platforms links your identities','Profile information may reveal personal details','Post history can reveal location patterns and routines','Username enumeration can find all your accounts','Cached/archived versions may reveal deleted content'],tips:['Use different usernames on sensitive platforms','Regularly audit your public profile information','Review and clean up old social media posts','Enable private/protected mode where available','Google yourself periodically to check exposure']},
    };
    const type=isEmail?'email':isPhone?'phone':'username';
    const d=riskData[type];
    return {riskLevel:d.score>=60?'high':d.score>=40?'medium':'low',riskScore:d.score,explanation:`Your ${type} "${query.replace(/.*:\s*/,'')}" has been analyzed for digital exposure. ${type==='email'?'Emails are commonly exposed in data breaches.':type==='phone'?'Phone numbers carry high identity risk in India due to Aadhaar linkage.':'Usernames can be used to cross-reference your identity across platforms.'}`,exposureData:{potentialRisks:d.risks,protectionTips:d.tips},suggestedActions:[`Check if your ${type} has been compromised`,'Update passwords on all linked accounts','Enable 2FA everywhere','Review privacy settings','Monitor for unauthorized access'],detectedPatterns:[`${type} analysis performed`,`Risk category: ${type} exposure`]};
  }

  async detectImpersonation(profileData) {
    const aiResult = await this.callOpenAI([{role:'system',content:'Detect fake profile indicators. Return JSON with riskLevel,riskScore,explanation,detectedPatterns,suggestedActions'},{role:'user',content:JSON.stringify(profileData)}],{temperature:0.3});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    let score=0;const flags=[];
    const p=profileData;
    if(!p.name||p.name.length<3){score+=15;flags.push('Name is missing or suspiciously short');}
    if(!p.bio||p.bio.length<10){score+=10;flags.push('Profile bio is empty or very minimal');}
    if(p.followerCount){const f=parseInt(p.followerCount);if(f<5){score+=20;flags.push(`Very low follower count (${f}) — common in fake accounts`);}if(f>10000&&p.accountAge&&p.accountAge.includes('month')&&parseInt(p.accountAge)<3){score+=25;flags.push('Unrealistic follower count for account age');}}
    if(p.accountAge){const age=p.accountAge.toLowerCase();if(age.includes('day')||age.includes('week')||(age.includes('month')&&parseInt(age)<2)){score+=20;flags.push(`Very new account (${p.accountAge}) — high impersonation risk`);}}
    if(p.bio){const bio=p.bio.toLowerCase();if(bio.includes('dm me')||bio.includes('click link')||bio.includes('earn money')||bio.includes('crypto')){score+=15;flags.push('Bio contains suspicious/spammy language');}}
    if(p.platform){const plat=p.platform.toLowerCase();if(plat.includes('instagram')&&parseInt(p.followerCount||0)<10){score+=10;flags.push('Instagram account with unusually low engagement');}}
    if(flags.length===0){score=10;flags.push('No major red flags detected, but verify through direct communication');}
    score=Math.min(score,100);
    return {riskLevel:score>=60?'high':score>=35?'medium':'low',riskScore:score,explanation:score>=60?`HIGH RISK: ${flags.length} red flags detected. This profile shows multiple characteristics of a fake or impersonation account. Do NOT share personal information.`:score>=35?`MODERATE RISK: Some suspicious indicators found. Verify this person's identity through video call or mutual connections before trusting them.`:`LOW RISK: Profile appears relatively normal. However, always verify identity before sharing sensitive information.`,detectedPatterns:flags,suggestedActions:score>=50?['Do NOT share personal information','Request a video call to verify identity','Check if they have mutual connections','Search for the profile image using reverse image search','Report the profile to the platform']:['Verify through mutual connections','Be cautious with personal details','Monitor for inconsistent behavior']};
  }

  async simulateAttack(scenario) {
    const aiResult = await this.callOpenAI([{role:'system',content:'Create educational attack simulation showing predator tactics. Return JSON with riskLevel,riskScore,explanation,attackSteps:[{step,phase,description,indicators}],suggestedActions,detectedPatterns'},{role:'user',content:scenario}],{temperature:0.7});
    if(aiResult) try{return JSON.parse(aiResult)}catch{}

    const lower=scenario.toLowerCase();
    const sims={
      'dating':{explain:'Online dating predators follow a calculated 3-phase approach to exploit trust.',steps:[{step:1,phase:'Trust Building',description:'The predator creates an attractive profile, often using stolen photos. They shower you with compliments ("love-bombing"), respond instantly, and claim an immediate deep connection. They share fake vulnerable stories to build false intimacy.',indicators:['Unusually fast emotional attachment','Too good to be true profile','Claims of instant soul connection','Avoids video calls']},{step:2,phase:'Manipulation',description:'Once trust is established, they begin isolating you from friends/family ("they dont understand us"). They create dependency through intermittent reinforcement — alternating between extreme affection and cold withdrawal.',indicators:['Discourages contact with friends/family','Gets angry if you dont respond immediately','Alternates between loving and cold','Starts asking for personal photos or money']},{step:3,phase:'Threat',description:'The predator reveals their true intent — demanding money, explicit content, or meetings. They threaten to share private conversations or photos. If you resist, threats escalate to violence, exposure, or harassment.',indicators:['Demands for money or gifts','Threats to share private content','Pressuring for in-person meeting in private location','Emotional blackmail and guilt-tripping']}]},
      'grooming':{explain:'Social media grooming is a systematic process where predators target and exploit vulnerable individuals.',steps:[{step:1,phase:'Trust Building',description:'The groomer identifies targets showing signs of loneliness, low self-esteem, or family problems. They position themselves as the perfect friend/mentor — always available, always understanding, never judgmental.',indicators:['Excessive interest in your personal problems','Always available to talk','Gives gifts or special attention','Establishes "special" relationship']},{step:2,phase:'Manipulation',description:'They introduce secrecy ("this is just between us"), normalize inappropriate topics gradually, and test boundaries. They make you feel guilty for questioning them and isolate you from other support systems.',indicators:['Requests for secrecy','Gradual introduction of sexual topics','Guilt-tripping when boundaries are set','Making you feel dependent']},{step:3,phase:'Threat',description:'When they have enough leverage (private conversations, photos, emotional dependency), they exploit it. They may threaten to reveal secrets, demand compliance, or escalate to physical meeting.',indicators:['Threatening to share private conversations','Demanding physical meetings alone','Using emotional leverage','Escalating requests']}]},
      'default':{explain:'Most online predatory attacks follow a consistent pattern of building trust, establishing control, and then exploiting the victim.',steps:[{step:1,phase:'Trust Building',description:'The attacker presents an appealing, trustworthy persona. They invest time understanding your vulnerabilities, mirror your interests, and create a sense of special connection. This phase can last days to months.',indicators:['Mirroring your interests exactly','Excessive flattery and attention','Sharing "deep personal secrets" early','Creating urgency in the relationship']},{step:2,phase:'Manipulation',description:'Control is established gradually. The attacker creates emotional dependency, isolates you from support networks, and begins testing your boundaries. They use guilt, shame, and obligation as tools.',indicators:['Isolating from friends and family','Creating rules for the relationship','Emotional outbursts when questioned','Monitoring your online activity']},{step:3,phase:'Threat',description:'The attacker leverages the dependency and any compromising information gathered. Demands escalate. Refusal is met with threats of exposure, violence, or emotional devastation.',indicators:['Direct threats or ultimatums','Leveraging private information','Demands that escalate over time','Refusal to accept "no"']}]}
    };
    const key=lower.includes('dating')||lower.includes('romance')?'dating':lower.includes('groom')||lower.includes('social media')?'grooming':'default';
    const sim=sims[key];
    return {riskLevel:'high',riskScore:78,explanation:`⚠️ EDUCATIONAL SIMULATION: ${sim.explain} Understanding these patterns is your first line of defense.`,attackSteps:sim.steps,suggestedActions:['Never share intimate photos or financial information online','Verify identity through video calls before trusting anyone','Trust your instincts — if something feels wrong, it probably is','Keep evidence of all suspicious interactions','Report predatory behavior to platform and authorities','Talk to someone you trust if you feel targeted'],detectedPatterns:['3-phase attack pattern identified','Trust exploitation methodology','Escalation from emotional to coercive control'],category:'attack-simulation'};
  }

  async getEmotionalSupport(userState) {
    const sysPrompt = `You are a compassionate AI safety companion for women. Be concise, highly structured, clear, and informative (like ChatGPT). Provide practical steps. Indian context — mention Indian helplines (Women Helpline 181, Police 112, iCall 9152987821). Return JSON: {"response":"...","stressLevel":"low|moderate|high|severe","suggestedActions":["..."],"resources":["..."],"needsProfessionalHelp":false}`;
    const aiResult = await this.callOpenAI([{role:'system',content:sysPrompt},{role:'user',content:userState}],{temperature:0.7});
    if(aiResult) try{return JSON.parse(aiResult)}catch{return{response:aiResult,stressLevel:'moderate',suggestedActions:['Take care of yourself'],resources:['Women Helpline: 181'],needsProfessionalHelp:false};}

    const lower = userState.toLowerCase();
    const isAnxious=lower.match(/anxious|anxiety|panic|scared|afraid|terrified|worry|worried|nervous|shaking/);
    const isSad=lower.match(/sad|depressed|hopeless|worthless|empty|alone|lonely|crying|tears|miserable|unhappy/);
    const isAngry=lower.match(/angry|furious|rage|hate|frustrated|mad|annoyed|irritated/);
    const isTrauma=lower.match(/abuse|assaulted|attacked|harassed|stalked|raped|violated|beaten|hurt me|hit me/);
    const isSuicidal=lower.match(/suicide|kill myself|end it|dont want to live|no point|want to die/);
    const isStressed=lower.match(/stressed|overwhelmed|cant cope|too much|breaking down|exhausted|burnout/);

    if(isSuicidal) return {
      response: "Your life matters. What you are experiencing right now is overwhelming, but temporary. Please reach out for immediate support.\n\n**Emergency Contacts (India, 24/7):**\n• **Vandrevala Foundation:** 1860-2662-345\n• **iCall:** 9152987821\n• **AASRA:** 91-22-27546669\n\n**Immediate Steps:**\n1. Ensure your physical safety.\n2. Call one of the numbers above or a trusted contact immediately.\n3. Do not remain isolated.",
      stressLevel:'severe', suggestedActions:['Call a helpline immediately','Contact a trusted friend or family member','Remove yourself from isolation'], resources:['Vandrevala: 1860-2662-345','iCall: 9152987821','AASRA: 91-22-27546669'], needsProfessionalHelp:true
    };

    if(isTrauma) return {
      response: "I am deeply sorry you experienced this. What happened is a violation, and it is **not your fault**.\n\n**Immediate Actions for Your Safety & Justice:**\n1. **Ensure Immediate Safety:** If you are in danger, dial **112** (Police).\n2. **Seek Support:** Call the Women Helpline at **181** (24/7, confidential).\n3. **Medical & Legal Aid:** Visit your nearest 'One Stop Centre' (OSC) for comprehensive legal, medical, and psychological assistance.\n\nWould you like guidance on how to safely file a report?",
      stressLevel:'severe', suggestedActions:['Dial 112 if in danger','Call Women Helpline 181','Visit a One Stop Centre'], resources:['Women Helpline: 181','Police: 112','One Stop Centre Scheme'], needsProfessionalHelp:true
    };

    if(isAnxious) return {
      response: "It is completely normal to feel anxious in high-stress situations. Let's actively lower your anxiety right now.\n\n**Immediate Grounding Technique (4-7-8 Breathing):**\n1. **Inhale** slowly for 4 seconds.\n2. **Hold** your breath for 7 seconds.\n3. **Exhale** completely for 8 seconds.\n4. Repeat this cycle 4 times.\n\n**Next Steps:**\n• Step away from the source of stress if possible.\n• Name 5 objects around you to ground your mind in the present.\n\nHow are you feeling after trying the breathing exercise?",
      stressLevel:'high', suggestedActions:['Use the 4-7-8 breathing technique','Perform grounding exercises (5 senses)','Step away from triggers'], resources:['iCall: 9152987821'], needsProfessionalHelp:false
    };

    if(isSad) return {
      response: "I hear you. Feeling sad or exhausted is a valid emotional response to difficult circumstances.\n\n**Actionable Self-Care Steps:**\n1. **Change Your Environment:** Step outside or move to a different room for a quick reset.\n2. **Connect:** Message or call one person who makes you feel safe.\n3. **Decompress:** Engage in a low-energy activity (listen to music, hydrate, rest).\n\nIf this feeling persists deeply, consider reaching out to iCall (9152987821) for free psychological counseling.",
      stressLevel:'high', suggestedActions:['Change physical environment briefly','Reach out to a trusted contact','Hydrate and rest'], resources:['iCall: 9152987821'], needsProfessionalHelp:false
    };

    if(isAngry) return {
      response: "Anger is a natural and valid response to boundary violations or injustice. It is a powerful tool when channeled correctly.\n\n**Constructive Ways to Process Anger:**\n1. **Physical Release:** Engage in quick physical activity (walking, stretching) to burn cortisol.\n2. **Documentation:** Write down exactly what happened and why it crossed your boundaries. This serves as both an emotional release and potential evidence.\n3. **Take Control:** Use this energy to strengthen your privacy settings, block individuals, or set firm boundaries.\n\nWhat boundary was crossed today?",
      stressLevel:'moderate', suggestedActions:['Document the incident','Engage in physical release','Establish firm boundaries'], resources:['Women Helpline: 181'], needsProfessionalHelp:false
    };

    if(isStressed) return {
      response: "You are experiencing mental overload. It is critical to pause and reset your nervous system.\n\n**Quick Decompression Protocol:**\n1. **Pause:** Close your eyes and drop your shoulders for 30 seconds.\n2. **Isolate:** Identify the *single* most urgent task. Ignore everything else for now.\n3. **Delegate/Delay:** What can be postponed until tomorrow? Push it off.\n\nYou do not have to fix everything today. Focus strictly on what is immediately necessary.",
      stressLevel:'moderate', suggestedActions:['Isolate the single most urgent task','Delay non-critical tasks','Take a 30-second physical reset'], resources:['iCall: 9152987821'], needsProfessionalHelp:false
    };

    return {
      response: "I am here to support you. This is a secure, judgment-free space designed for your safety and well-being.\n\n**How I Can Assist You Today:**\n• **Safety Planning:** Guide you through securing your digital and physical presence.\n• **Emotional Support:** Provide coping strategies for anxiety or stress.\n• **Evidence Logging:** Help you document incidents securely.\n\nPlease share what you are currently dealing with.",
      stressLevel:'low', suggestedActions:['Identify your current primary concern','Review your safety settings','Breathe and center yourself'], resources:['Women Helpline: 181','iCall: 9152987821'], needsProfessionalHelp:false
    };
  }
}

export default new AIService();
