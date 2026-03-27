import { NextRequest, NextResponse } from "next/server";
import { generateContent, isGeminiConfigured } from "@/lib/gemini";

// Physical Therapy AI System Prompt
const PHYSICAL_THERAPY_SYSTEM_PROMPT = `You are Clara, an expert AI assistant specialized in physical therapy. You have extensive knowledge of:

**Physical Therapy Domains:**
- Orthopedic rehabilitation (joint injuries, fractures, post-surgical recovery)
- Sports medicine and athletic performance
- Neurological rehabilitation (stroke, spinal cord injuries, Parkinson's)
- Pediatric physical therapy
- Geriatric care and fall prevention
- Cardiopulmonary rehabilitation
- Pain management and chronic conditions
- Manual therapy techniques
- Therapeutic exercise prescription
- Gait and balance training
- Functional movement assessment

**Clinical Knowledge:**
- Anatomy and physiology relevant to physical therapy
- Common conditions (rotator cuff injuries, ACL tears, low back pain, sciatica, etc.)
- Treatment protocols and evidence-based interventions
- Exercise physiology and biomechanics
- Modalities (heat, cold, ultrasound, electrical stimulation)
- Assistive devices and orthotics
- Home exercise programs
- Patient education strategies

**Professional Guidelines:**
- Always emphasize that you provide educational information only
- Recommend consulting with licensed physical therapists for specific treatment
- Never provide medical diagnoses or replace professional medical advice
- Support evidence-based practice and current research
- Respect patient autonomy and informed consent

**Communication Style:**
- Be clear, empathetic, and professional
- Use appropriate medical terminology but explain when needed
- Provide practical, actionable advice
- Reference evidence when appropriate
- Encourage patient engagement and adherence

Answer questions about physical therapy comprehensively, but always remind users that specific treatment should be discussed with their licensed physical therapist.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Check for Gemini API key
    if (!isGeminiConfigured()) {
      console.log("No Gemini API key found, using enhanced fallback knowledge base");
      const lastUserMessage = messages
        .filter((msg: any) => msg.sender === "user" || !msg.sender || msg.role === "user")
        .slice(-1)[0];
      const question = lastUserMessage?.text || lastUserMessage?.content || messages[messages.length - 1]?.content || "";
      return NextResponse.json({
        message: await handlePhysicalTherapyQuestion(question, messages),
      });
    }

    // Build Gemini contents: alternating user/model from messages
    const contents: { role: "user" | "model"; parts: [{ text: string }] }[] = [];
    for (const msg of messages) {
      const content = (msg.text || msg.content || "").trim();
      if (!content) continue;
      const role = msg.sender === "user" ? "user" : "model";
      contents.push({ role, parts: [{ text: content }] });
    }
    if (contents.length === 0) {
      return NextResponse.json(
        { error: "No messages to send" },
        { status: 400 }
      );
    }

    const result = await generateContent({
      contents,
      systemInstruction: { parts: [{ text: PHYSICAL_THERAPY_SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    });

    if (!result.ok) {
      console.error("Gemini API Error:", result.status, result.error);
      const isQuotaOrBilling =
        result.status === 429 ||
        result.status === 503 ||
        /quota|billing|insufficient|limit exceeded|api key/i.test(result.error);
      if (isQuotaOrBilling) {
        return NextResponse.json({
          message: "Gemini quota exceeded or API key issue. Check your key at https://aistudio.google.com/apikey — AI chat will work again after you update your account.",
        });
      }
      const lastUserMessage = messages
        .filter((msg: any) => msg.sender === "user" || !msg.sender || msg.role === "user")
        .slice(-1)[0];
      const question = lastUserMessage?.text || lastUserMessage?.content || messages[messages.length - 1]?.content || "";
      return NextResponse.json({
        message: await handlePhysicalTherapyQuestion(question, messages),
      });
    }

    return NextResponse.json({
      message: result.text,
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// Enhanced fallback knowledge-based response system with conversation context
async function handlePhysicalTherapyQuestion(question: string, conversationHistory: any[] = []): Promise<string> {
  const lowerQuestion = question.toLowerCase();

  // Analyze conversation context
  const previousMessages = conversationHistory
    .filter((msg: any) => msg.sender === "user" || msg.role === "user")
    .slice(-3); // Last 3 user messages for context
  
  const context = previousMessages.map((msg: any) => (msg.text || msg.content || "").toLowerCase()).join(" ");

  // Comprehensive knowledge base with multiple keywords per topic
  const knowledgeBase: Array<{ keywords: string[]; response: string }> = [
    {
      keywords: ["rotator cuff", "shoulder pain", "shoulder injury", "shoulder impingement"],
      response: `Rotator cuff injuries are common shoulder problems. Treatment typically includes:

**Acute Phase:**
- Rest and activity modification to avoid aggravating movements
- Ice application to reduce inflammation
- Pain management

**Rehabilitation Phase:**
- Physical therapy focusing on strengthening the rotator cuff muscles (supraspinatus, infraspinatus, teres minor, subscapularis)
- Range of motion exercises to restore mobility
- Scapular stabilization exercises
- Manual therapy techniques (joint mobilization, soft tissue work)
- Gradual return to activity with proper form

**Recovery Timeline:**
- Minor strains: 4-6 weeks
- Partial tears: 6-12 weeks
- Post-surgical: 3-6 months

Always consult with a licensed physical therapist for a personalized treatment plan based on your specific condition.`,
    },
    {
      keywords: ["low back pain", "lumbar", "back pain", "lower back", "lumbago", "disc"],
      response: `Low back pain is one of the most common conditions treated in physical therapy. Management includes:

**Evidence-Based Interventions:**
- Core strengthening exercises (transverse abdominis, multifidus)
- Flexibility and stretching (hamstrings, hip flexors, piriformis)
- Postural education and ergonomic modifications
- Manual therapy (mobilization, manipulation, soft tissue techniques)
- Activity modification and pacing strategies
- Pain neuroscience education
- Graded exercise therapy

**Key Principles:**
- Active treatment (exercise) is more effective than passive modalities alone
- Early mobilization is generally better than bed rest
- Address both physical and psychosocial factors
- Individualized approach based on specific impairments

A physical therapist can assess your specific condition, identify contributing factors, and create a tailored program.`,
    },
    {
      keywords: ["acl", "anterior cruciate", "knee ligament", "acl tear", "acl reconstruction"],
      response: `ACL (anterior cruciate ligament) rehabilitation is a structured, phased process:

**Phase 1: Acute (0-2 weeks)**
- Reduce swelling (RICE: rest, ice, compression, elevation)
- Restore range of motion (especially extension)
- Early quadriceps activation
- Gait training with assistive device if needed

**Phase 2: Early Rehabilitation (2-6 weeks)**
- Progressive strengthening (quadriceps, hamstrings, glutes)
- Balance and proprioception training
- Continue ROM work
- Begin closed-chain exercises

**Phase 3: Advanced Strengthening (6-12 weeks)**
- Advanced strengthening exercises
- Agility and plyometric training
- Sport-specific movements
- Running progression (if appropriate)

**Phase 4: Return to Sport (3-6+ months)**
- Sport-specific training
- Cutting and pivoting drills
- Gradual return to play protocol
- Ongoing strength maintenance

**Timeline:** Return to sports typically takes 6-9 months post-surgery. Work closely with your physical therapist throughout the process.`,
    },
    {
      keywords: ["knee pain", "patellofemoral", "runner's knee", "it band", "meniscus"],
      response: `Knee pain can have various causes. Common physical therapy interventions include:

**Common Conditions:**
- Patellofemoral pain syndrome (runner's knee)
- IT band syndrome
- Meniscal injuries
- Osteoarthritis
- Patellar tendinopathy

**Treatment Approaches:**
- Quadriceps and hamstring strengthening
- Hip strengthening (glutes, especially gluteus medius)
- Balance and proprioception training
- Gait analysis and training
- Patellofemoral joint mobilization
- Activity modification
- Taping or bracing if indicated

A physical therapist will assess the specific cause of your knee pain through movement analysis and develop an appropriate treatment plan.`,
    },
    {
      keywords: ["stretching", "flexibility", "range of motion", "rom"],
      response: `Stretching is important for maintaining flexibility and range of motion. Best practices:

**Types of Stretching:**
- **Dynamic stretching:** Before activity to warm up
- **Static stretching:** After activity or as a separate session
- **PNF (Proprioceptive Neuromuscular Facilitation):** Advanced technique with contraction-relaxation

**Guidelines:**
- Hold static stretches for 30-60 seconds
- Stretch to mild discomfort, not pain
- Breathe normally during stretches
- Perform 2-4 repetitions per stretch
- Stretch major muscle groups regularly

**Important Notes:**
- Always warm up before stretching
- Don't stretch through sharp pain
- Consistency is key for long-term improvements
- Consult a physical therapist for stretches specific to your needs and condition`,
    },
    {
      keywords: ["exercise", "therapeutic exercise", "strengthening", "rehabilitation"],
      response: `Therapeutic exercise is a cornerstone of physical therapy. Key principles:

**Principles of Therapeutic Exercise:**
- **Specificity:** Exercises should target your specific condition and goals
- **Progression:** Gradually increase difficulty (load, reps, complexity)
- **Overload:** Challenge tissues appropriately for adaptation
- **Reversibility:** Consistency is essential - "use it or lose it"
- **Individualization:** Programs should be tailored to you

**Types of Exercises:**
- Strengthening (resistance training)
- Flexibility and stretching
- Balance and proprioception
- Cardiovascular conditioning
- Functional movement training

Your physical therapist will design exercises based on your assessment, goals, and stage of recovery.`,
    },
    {
      keywords: ["post-surgical", "post-op", "after surgery", "surgical recovery"],
      response: `Post-surgical rehabilitation is crucial for optimal recovery. Key considerations:

**Early Phase (0-2 weeks):**
- Protect surgical site
- Manage swelling and pain
- Begin gentle range of motion (as tolerated)
- Early muscle activation

**Rehabilitation Phase:**
- Progressive range of motion
- Gradual strengthening
- Functional training
- Return to activities of daily living

**Advanced Phase:**
- Sport or activity-specific training
- Full return to function

**Important:**
- Follow your surgeon's protocol
- Communicate with both surgeon and physical therapist
- Don't rush the process - healing takes time
- Address both the surgical site and surrounding areas

Recovery timelines vary significantly based on the procedure. Your physical therapist will guide you through each phase.`,
    },
    {
      keywords: ["neck pain", "cervical", "whiplash", "neck stiffness"],
      response: `Neck pain is commonly treated in physical therapy. Approaches include:

**Common Causes:**
- Muscle strain
- Cervical disc issues
- Postural problems
- Whiplash injuries
- Arthritis

**Treatment:**
- Cervical range of motion exercises
- Strengthening (deep neck flexors, upper back)
- Postural retraining
- Manual therapy
- Ergonomic modifications
- Pain management strategies

A physical therapist can assess your specific condition and develop an appropriate treatment plan.`,
    },
    {
      keywords: ["hip pain", "hip impingement", "hip bursitis", "hip replacement"],
      response: `Hip pain can stem from various sources. Physical therapy interventions include:

**Common Conditions:**
- Hip impingement (FAI)
- Bursitis
- Osteoarthritis
- Labral tears
- Post-hip replacement

**Treatment:**
- Hip strengthening (glutes, hip abductors)
- Core stabilization
- Flexibility work (hip flexors, IT band)
- Gait training
- Manual therapy
- Activity modification

A thorough assessment by a physical therapist can identify the specific cause and guide treatment.`,
    },
  ];

  // Check for keywords in current question and context
  for (const topic of knowledgeBase) {
    const matchesKeyword = topic.keywords.some(keyword => 
      lowerQuestion.includes(keyword) || context.includes(keyword)
    );
    
    if (matchesKeyword) {
      // Check if asking for more details
      if (lowerQuestion.includes("more") || lowerQuestion.includes("detail") || lowerQuestion.includes("explain")) {
        return topic.response;
      }
      
      // Check if asking about something specific within the topic
      if (lowerQuestion.includes("how long") || lowerQuestion.includes("timeline") || lowerQuestion.includes("recovery")) {
        return topic.response;
      }
      
      return topic.response;
    }
  }

  // Check for follow-up questions
  if (lowerQuestion.includes("what about") || lowerQuestion.includes("how about") || lowerQuestion.includes("tell me more")) {
    if (context) {
      return `Based on our previous discussion, I'd recommend consulting with a licensed physical therapist who can:
- Assess your specific condition through a thorough evaluation
- Create a personalized treatment plan
- Monitor your progress and adjust interventions
- Address any complications or concerns

For more detailed information, could you specify which aspect you'd like to know more about?`;
    }
  }

  // General response with helpful guidance
  return `I'd be happy to help with your physical therapy question! 

**To provide the best assistance, I can help with:**
- Common conditions (rotator cuff, ACL, low back pain, knee pain, etc.)
- Rehabilitation protocols and timelines
- Exercise and stretching principles
- Post-surgical recovery
- General treatment approaches

**For the most accurate information:**
1. **Consult with a licensed physical therapist** - They can assess your specific condition
2. **Get a proper evaluation** - Physical therapists use evidence-based assessments
3. **Follow evidence-based treatment** - Your therapist will guide appropriate interventions

**Note:** To enable AI-powered responses with full conversation context, please set up a Gemini API key in your .env.local file (get one at https://aistudio.google.com/apikey):
\`\`\`
GEMINI_API_KEY=your-gemini-key-here
\`\`\`

Could you provide more details about your specific question? I can offer general guidance on physical therapy topics.

Remember: This information is educational and should not replace professional medical advice.`;
}
