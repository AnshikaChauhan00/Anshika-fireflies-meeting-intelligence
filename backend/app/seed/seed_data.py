"""Static seed content: people, and 7 realistic meetings with full dialogue,
curated summaries, topics and action items. Kept separate from seed.py so
the data is easy to scan/edit independently of the insertion logic.
"""
from __future__ import annotations

from dataclasses import dataclass, field


def _avatar(name: str) -> str:
    initials = "+".join(name.split())
    return f"https://ui-avatars.com/api/?name={initials}&background=6366F1&color=fff"


PEOPLE = {
    "Anshika Chauhan": {"email": "anshika.chauhan@meetingnotes.app", "role": "Product Manager"},
    "Rahul Verma": {"email": "rahul.verma@meetingnotes.app", "role": "Engineering Lead"},
    "Priya Nair": {"email": "priya.nair@meetingnotes.app", "role": "UX Designer"},
    "Karan Mehta": {"email": "karan.mehta@meetingnotes.app", "role": "Backend Engineer"},
    "Neha Kapoor": {"email": "neha.kapoor@meetingnotes.app", "role": "Marketing Manager"},
    "Vikram Singh": {"email": "vikram.singh@meetingnotes.app", "role": "Sales Director"},
    "Sara Thomas": {"email": "sara.thomas@meetingnotes.app", "role": "Customer Success Manager"},
    "Aditya Rao": {"email": "aditya.rao@meetingnotes.app", "role": "QA Engineer"},
    "Meera Iyer": {"email": "meera.iyer@clientco.example", "role": "VP Operations (Client)"},
}

OWNER_NAME = "Anshika Chauhan"


@dataclass
class SeedActionItem:
    title: str
    assignee: str
    due_offset_days: int
    status: str = "TODO"


@dataclass
class SeedTopic:
    title: str
    start_index: int  # index into dialogue where this topic begins


@dataclass
class SeedComment:
    segment_index: int  # index into dialogue of the line being commented on
    text: str


@dataclass
class SeedMeeting:
    title: str
    description: str
    days_ago: int
    duration_minutes: int
    participants: list[str]
    dialogue: list[tuple[str, str]]
    topics: list[SeedTopic]
    action_items: list[SeedActionItem]
    tags: list[str]
    overview: str
    comments: list[SeedComment] = field(default_factory=list)


MEETINGS: list[SeedMeeting] = [
    SeedMeeting(
        title="Product Roadmap Discussion",
        comments=[
            SeedComment(3, "Let's get a cost estimate for the read replicas before we commit to this approach."),
            SeedComment(14, "Need to confirm October 15th with legal before we announce it externally."),
            SeedComment(14, "Confirmed with legal, the 15th works. Safe to share with the enterprise accounts."),
        ],
        description="Aligning on Q4 priorities: the analytics dashboard, mobile onboarding, and release timeline.",
        days_ago=1,
        duration_minutes=45,
        participants=["Anshika Chauhan", "Rahul Verma", "Priya Nair", "Karan Mehta", "Neha Kapoor"],
        tags=["roadmap", "product", "planning"],
        dialogue=[
            ("Anshika Chauhan", "Good morning everyone, thanks for joining. Let's start with the Q4 product roadmap and align on priorities before the planning cycle closes."),
            ("Rahul Verma", "Morning. From the engineering side, we've wrapped up the infrastructure migration, so we have more bandwidth starting next sprint."),
            ("Anshika Chauhan", "That's great news. I think the biggest priority is the analytics dashboard our enterprise customers have been asking for."),
            ("Karan Mehta", "I agree. I've already sketched out the data model for the dashboard. We'll need read replicas to keep the queries fast though."),
            ("Priya Nair", "From a design perspective, I've done some early wireframes. I can share the Figma file after this call."),
            ("Anshika Chauhan", "Perfect. Let's also talk about the mobile app improvements. Support tickets show users are struggling with the onboarding flow."),
            ("Neha Kapoor", "Marketing has heard the same thing from beta users. A shorter onboarding would definitely help conversion."),
            ("Priya Nair", "I can redesign the onboarding screens this week and have something ready for review by Thursday."),
            ("Rahul Verma", "Sounds good. Karan, can you and the backend team start on the analytics dashboard API next week?"),
            ("Karan Mehta", "Yes, we should be able to finalize the technical estimate by Wednesday."),
            ("Anshika Chauhan", "Great, let's finalize the dashboard requirements document first so Karan's estimate is accurate."),
            ("Neha Kapoor", "Should we also revisit the pricing page? A few customers mentioned confusion around the enterprise tier."),
            ("Anshika Chauhan", "Good point, let's put that on next week's agenda separately so we don't lose focus today."),
            ("Rahul Verma", "One more thing, the analytics dashboard will need a hard deadline. If we want it in the Q4 release, we need to lock scope by end of this month."),
            ("Anshika Chauhan", "Agreed. Let's target October 15th as the internal deadline for the first version."),
            ("Karan Mehta", "That works for the backend. I'll flag any risks as soon as I see them."),
            ("Priya Nair", "I'll also prepare a technical estimate for the design work needed on the dashboard."),
            ("Anshika Chauhan", "Perfect. To summarize: Priya redesigns onboarding by Thursday, Karan finalizes the dashboard technical estimate by Wednesday, and we lock scope by end of month."),
            ("Neha Kapoor", "I'll schedule a client review with two of our enterprise accounts once the dashboard wireframes are ready."),
            ("Anshika Chauhan", "Sounds like a plan. Let's schedule a follow-up next Monday to check progress. Thanks everyone."),
            ("Rahul Verma", "Sounds good, talk soon."),
        ],
        topics=[
            SeedTopic("Q4 Roadmap Kickoff", 0),
            SeedTopic("Analytics Dashboard Planning", 3),
            SeedTopic("Mobile Onboarding Improvements", 6),
            SeedTopic("Timeline & Deadlines", 13),
        ],
        action_items=[
            SeedActionItem("Finalize dashboard requirements document", "Anshika Chauhan", 3, "TODO"),
            SeedActionItem("Prepare technical estimate for dashboard design", "Priya Nair", 5, "IN_PROGRESS"),
            SeedActionItem("Redesign onboarding screens", "Priya Nair", 2, "TODO"),
            SeedActionItem("Schedule client review with enterprise accounts", "Neha Kapoor", 7, "TODO"),
        ],
        overview=(
            "The team aligned on Q4 priorities, agreeing the analytics dashboard is the top priority "
            "for enterprise customers, alongside a redesign of the mobile onboarding flow. Engineering "
            "committed to a technical estimate by Wednesday and an internal deadline of October 15th for "
            "the first dashboard release, while design will deliver revised onboarding screens by Thursday."
        ),
    ),
    SeedMeeting(
        title="Engineering Sprint Planning",
        comments=[
            SeedComment(8, "Good catch. Link Aditya's write-up to the CI ticket so we can close both together."),
        ],
        description="Planning Sprint 24: analytics dashboard API breakdown, bug triage, and estimation.",
        days_ago=2,
        duration_minutes=32,
        participants=["Rahul Verma", "Karan Mehta", "Aditya Rao", "Anshika Chauhan"],
        tags=["engineering", "sprint", "planning"],
        dialogue=[
            ("Rahul Verma", "Alright team, let's plan Sprint 24. We have two weeks and the analytics dashboard API is the top priority."),
            ("Karan Mehta", "I've broken the dashboard API into four tickets: schema migration, the query service, caching layer, and the export endpoint."),
            ("Anshika Chauhan", "From the product side, the export endpoint isn't required for the first release, so we can move that to Sprint 25 if needed."),
            ("Rahul Verma", "Good, that gives us more breathing room. Karan, how many story points for the schema migration?"),
            ("Karan Mehta", "I'd estimate five points. The query service is the riskiest piece, probably eight points."),
            ("Aditya Rao", "I'll need at least two days to write test cases once the query service is stable, so let's not schedule it for the very last day."),
            ("Rahul Verma", "Noted. Let's also fix the flaky login test that's been failing intermittently in CI."),
            ("Karan Mehta", "That one's been blocking merges. I can take a look tomorrow morning."),
            ("Aditya Rao", "I found the root cause last week, it's a race condition in the session token refresh. I'll write it up and assign it to Karan."),
            ("Rahul Verma", "Perfect, thanks Aditya. Let's also carry over the pagination bug from last sprint since it's still unresolved."),
            ("Anshika Chauhan", "That pagination bug is affecting a few enterprise customers, so let's prioritize it early in the sprint."),
            ("Rahul Verma", "Agreed, we'll put it first. Karan, can you take that as well since you're familiar with the API layer?"),
            ("Karan Mehta", "Sure, I'll knock that out on day one."),
            ("Aditya Rao", "I'll also set up automated regression tests for the transcript search feature since that's grown more complex."),
            ("Rahul Verma", "Good call. Let's make sure we have a staging deployment by the end of week one so QA has time to test."),
            ("Anshika Chauhan", "I'll join the mid-sprint demo on Thursday of week one if that works for everyone."),
            ("Rahul Verma", "Works for us. Let's also make sure the technical estimate for the caching layer is finalized before we commit to the sprint."),
            ("Karan Mehta", "I'll have that estimate ready by tomorrow end of day."),
            ("Rahul Verma", "Great, let's finalize the sprint backlog by tomorrow and kick off Monday. Thanks everyone, that's a wrap."),
        ],
        topics=[
            SeedTopic("Sprint 24 Priorities", 0),
            SeedTopic("Estimation & Risk Assessment", 4),
            SeedTopic("Bug Triage & CI Issues", 6),
            SeedTopic("Sprint Logistics", 14),
        ],
        action_items=[
            SeedActionItem("Fix flaky login test race condition", "Karan Mehta", 1, "IN_PROGRESS"),
            SeedActionItem("Fix pagination bug affecting enterprise customers", "Karan Mehta", 2, "TODO"),
            SeedActionItem("Set up automated regression tests for transcript search", "Aditya Rao", 6, "TODO"),
            SeedActionItem("Finalize caching layer technical estimate", "Karan Mehta", 1, "TODO"),
        ],
        overview=(
            "Engineering planned Sprint 24 around the analytics dashboard API, splitting it into schema "
            "migration, query service, and caching layer work while deferring the export endpoint to the "
            "next sprint. The team also prioritized a flaky CI login test and a pagination bug affecting "
            "enterprise customers, with a mid-sprint demo scheduled for Thursday."
        ),
    ),
    SeedMeeting(
        title="Marketing Strategy Meeting",
        description="Planning the Q4 go-to-market push around the analytics dashboard launch.",
        days_ago=4,
        duration_minutes=38,
        participants=["Neha Kapoor", "Anshika Chauhan", "Vikram Singh", "Sara Thomas"],
        tags=["marketing", "strategy", "growth"],
        dialogue=[
            ("Neha Kapoor", "Thanks for joining. Let's map out our Q4 marketing strategy around the analytics dashboard launch."),
            ("Anshika Chauhan", "The dashboard should be ready for a soft launch by mid-October, so messaging needs to be ready before that."),
            ("Vikram Singh", "From sales, our biggest ask is a one-pager we can send to enterprise prospects highlighting the new dashboard."),
            ("Neha Kapoor", "I can have a draft one-pager ready by next Tuesday."),
            ("Sara Thomas", "Customer success would love an in-app announcement too, so existing users don't miss it."),
            ("Neha Kapoor", "Good idea, I'll coordinate with design on an in-app banner and a follow-up email sequence."),
            ("Vikram Singh", "Do we have a webinar planned? That's usually our highest converting channel for feature launches."),
            ("Neha Kapoor", "Yes, I'm thinking we host a webinar the same week as launch, positioning it as Meeting Intelligence for Growing Teams."),
            ("Anshika Chauhan", "I like that. Let's make sure the webinar deck includes a live demo of the transcript search and action items."),
            ("Sara Thomas", "I can share a few customer quotes we've collected that talk about needing better meeting visibility."),
            ("Neha Kapoor", "Perfect, testimonials will help a lot with credibility."),
            ("Vikram Singh", "What's our budget for paid promotion around the launch?"),
            ("Neha Kapoor", "We have twelve thousand dollars allocated for October. I'll split it between LinkedIn ads and a retargeting campaign."),
            ("Anshika Chauhan", "Let's also make sure the pricing page confusion Neha mentioned last week gets resolved before we drive more traffic there."),
            ("Neha Kapoor", "Agreed, I'll follow up with design on the pricing page this week."),
            ("Vikram Singh", "One more thing, can we get case studies from two or three power users before the webinar?"),
            ("Sara Thomas", "I'll reach out to three accounts that have been very active with the transcript search feature."),
            ("Neha Kapoor", "Great, let's finalize the content calendar by Friday so everyone can review before the deadline."),
            ("Anshika Chauhan", "Sounds good, let's reconvene next week to review drafts."),
        ],
        topics=[
            SeedTopic("Q4 Launch Positioning", 0),
            SeedTopic("In-App & Email Announcements", 4),
            SeedTopic("Webinar Planning", 6),
            SeedTopic("Budget & Case Studies", 11),
        ],
        action_items=[
            SeedActionItem("Draft enterprise one-pager for dashboard launch", "Neha Kapoor", 4, "TODO"),
            SeedActionItem("Coordinate in-app announcement banner", "Neha Kapoor", 6, "TODO"),
            SeedActionItem("Collect customer case studies for webinar", "Sara Thomas", 8, "TODO"),
            SeedActionItem("Resolve pricing page confusion", "Neha Kapoor", 5, "IN_PROGRESS"),
        ],
        overview=(
            "Marketing outlined the go-to-market plan for the analytics dashboard launch, including an "
            "enterprise one-pager, an in-app announcement with email follow-up, and a launch-week webinar "
            "featuring a live product demo and customer testimonials. The team allocated a twelve thousand "
            "dollar October budget across LinkedIn ads and retargeting."
        ),
    ),
    SeedMeeting(
        title="Client Requirements Discussion",
        comments=[
            SeedComment(3, "Legal wants the ninety-day retention in writing. Attach this to the SOW."),
        ],
        description="Discovery call with Client Co covering SSO, data retention, and export requirements.",
        days_ago=6,
        duration_minutes=41,
        participants=["Anshika Chauhan", "Sara Thomas", "Rahul Verma", "Meera Iyer"],
        tags=["client", "requirements", "discovery"],
        dialogue=[
            ("Sara Thomas", "Thanks for making time today, Meera. We'd like to understand your team's requirements for the rollout."),
            ("Meera Iyer", "Of course. Our top priority is single sign-on. All our tools need to go through Okta for compliance reasons."),
            ("Rahul Verma", "That's very doable, we already support SAML-based SSO. I can have our team confirm the exact configuration steps."),
            ("Meera Iyer", "Great. Data retention is another big one. Our legal team requires meeting transcripts to be deletable after ninety days."),
            ("Anshika Chauhan", "Understood. We can add a configurable retention policy per workspace. Let me note that as a requirement."),
            ("Meera Iyer", "We'd also need to export meeting summaries and action items into our project management tool."),
            ("Rahul Verma", "We could expose that through our API. Would a CSV export be enough to start, or do you need a live integration?"),
            ("Meera Iyer", "A CSV export would work for the first phase. A live integration would be a nice to have later."),
            ("Anshika Chauhan", "Let's scope the CSV export as part of this rollout and log the live integration as a future enhancement."),
            ("Sara Thomas", "How many users do you expect to onboard in the first month?"),
            ("Meera Iyer", "Around forty users across three departments, with room to grow to two hundred by next year."),
            ("Rahul Verma", "That's well within what our infrastructure supports without any changes."),
            ("Meera Iyer", "One more requirement, we need admins to be able to bulk deactivate users when someone leaves the company."),
            ("Anshika Chauhan", "That's already supported in our admin console, so that one is covered."),
            ("Sara Thomas", "I'll put together a rollout timeline based on today's requirements and share it with you by Friday."),
            ("Meera Iyer", "Sounds good. Our internal deadline to have everything configured is the end of next month."),
            ("Rahul Verma", "We'll make sure the SSO configuration and retention policy are ready well before that deadline."),
            ("Anshika Chauhan", "To summarize: SSO via Okta, configurable retention policy, CSV export for action items, and bulk user deactivation. All achievable."),
            ("Meera Iyer", "Perfect, thank you all. This was very helpful."),
            ("Sara Thomas", "Thanks Meera, we'll follow up with the rollout plan by Friday."),
        ],
        topics=[
            SeedTopic("SSO & Compliance Requirements", 0),
            SeedTopic("Data Retention Policy", 3),
            SeedTopic("Export & Integration Needs", 5),
            SeedTopic("Rollout Timeline & Scale", 9),
        ],
        action_items=[
            SeedActionItem("Confirm SAML SSO configuration steps for client", "Rahul Verma", 3, "TODO"),
            SeedActionItem("Implement configurable transcript retention policy", "Rahul Verma", 10, "TODO"),
            SeedActionItem("Build CSV export for action items and summaries", "Rahul Verma", 12, "TODO"),
            SeedActionItem("Share rollout timeline with client", "Sara Thomas", 2, "IN_PROGRESS"),
        ],
        overview=(
            "Client Co outlined four core requirements for their rollout: Okta-based SSO, a configurable "
            "ninety-day transcript retention policy, CSV export of action items and summaries, and bulk "
            "user deactivation for offboarding. All requirements are achievable within the client's "
            "end-of-next-month deadline, and a rollout timeline will follow by Friday."
        ),
    ),
    SeedMeeting(
        title="Weekly Team Standup",
        description="Cross-functional standup covering engineering, design and QA progress for the week.",
        days_ago=0,
        duration_minutes=14,
        participants=["Anshika Chauhan", "Rahul Verma", "Karan Mehta", "Priya Nair", "Aditya Rao"],
        tags=["standup", "weekly", "sync"],
        dialogue=[
            ("Anshika Chauhan", "Morning everyone, let's do a quick round of updates. I'll start, I finished the dashboard requirements doc and shared it with the team yesterday."),
            ("Rahul Verma", "On the engineering side, the team wrapped up the schema migration and started on the query service."),
            ("Karan Mehta", "I finished the pagination bug fix and it's in code review now. I'll start the caching layer today."),
            ("Priya Nair", "I finished the onboarding redesign mockups and I'm waiting on feedback before I move to high fidelity screens."),
            ("Aditya Rao", "I found two more edge cases in the transcript search regression tests. Nothing blocking, just logging them as tickets."),
            ("Anshika Chauhan", "Any blockers for anyone?"),
            ("Karan Mehta", "The staging environment was down for about an hour this morning, but it's back up now."),
            ("Rahul Verma", "Yeah, that was a deploy issue on our end, already fixed."),
            ("Priya Nair", "No blockers from me, just waiting on design review feedback by end of day."),
            ("Aditya Rao", "No blockers. I should finish the regression suite by tomorrow."),
            ("Anshika Chauhan", "Great. Quick reminder that the mid-sprint demo is Thursday, so let's make sure our pieces are in a demoable state by then."),
            ("Rahul Verma", "The query service should be demoable by Wednesday, so we're on track."),
            ("Karan Mehta", "I'll make sure the caching layer at least shows partial results in the demo."),
            ("Anshika Chauhan", "Perfect. Let's also remember the client rollout deadline is end of next month, so SSO work needs to stay on schedule."),
            ("Rahul Verma", "That's already in progress, no concerns there."),
            ("Anshika Chauhan", "Great, sounds like a productive week. Thanks everyone, see you at the demo Thursday."),
        ],
        topics=[
            SeedTopic("Individual Updates", 0),
            SeedTopic("Blockers", 5),
            SeedTopic("Upcoming Demo & Deadlines", 10),
        ],
        action_items=[
            SeedActionItem("Move onboarding mockups to high fidelity after feedback", "Priya Nair", 2, "TODO"),
            SeedActionItem("Finish transcript search regression suite", "Aditya Rao", 1, "IN_PROGRESS"),
            SeedActionItem("Prepare query service for Wednesday demo", "Rahul Verma", 3, "TODO"),
        ],
        overview=(
            "The team shared quick updates: the dashboard requirements doc is complete, the pagination bug "
            "fix is in review, onboarding mockups are done pending feedback, and regression testing on "
            "transcript search is nearly finished. No major blockers were raised, and the team is on track "
            "for Thursday's mid-sprint demo."
        ),
    ),
    SeedMeeting(
        title="Project Review",
        description="Quarterly retrospective on Q3 outcomes across engineering, marketing and sales.",
        days_ago=8,
        duration_minutes=35,
        participants=["Anshika Chauhan", "Rahul Verma", "Neha Kapoor", "Vikram Singh", "Sara Thomas"],
        tags=["review", "retrospective", "quarterly"],
        dialogue=[
            ("Anshika Chauhan", "Let's review how Q3 went before we finalize the Q4 roadmap. Overall we shipped the transcript search feature and the mobile redesign."),
            ("Rahul Verma", "From engineering, the transcript search rollout went smoothly. The mobile redesign took two extra weeks due to the SSO integration work that came up mid-quarter."),
            ("Neha Kapoor", "On marketing, the feature launch emails had a solid thirty-two percent open rate, above our average."),
            ("Vikram Singh", "Sales-wise, we closed four new enterprise deals this quarter, partly influenced by the transcript search feature."),
            ("Sara Thomas", "Customer satisfaction scores also went up slightly, though we did get feedback about the onboarding flow being confusing."),
            ("Anshika Chauhan", "Right, that's exactly why the onboarding redesign is a priority for Q4."),
            ("Rahul Verma", "One lesson learned, we should scope client requests earlier so unplanned work like the SSO integration doesn't slip other deadlines."),
            ("Anshika Chauhan", "Agreed. Let's make sure any inbound client requirements go through a proper scoping review before we commit a sprint to them."),
            ("Vikram Singh", "From sales, we'd love earlier visibility into what's shipping so we can time outbound campaigns better."),
            ("Neha Kapoor", "I can share the marketing content calendar with sales at the start of each quarter going forward."),
            ("Sara Thomas", "That would help customer success too, so we can prep account managers ahead of launches."),
            ("Anshika Chauhan", "Let's make that official, a quarterly roadmap review with sales, marketing, and customer success before each release cycle."),
            ("Rahul Verma", "Sounds good. Engineering will also start flagging risk earlier when unplanned work threatens a deadline."),
            ("Anshika Chauhan", "Great retro. To summarize: better scoping for inbound client work, shared roadmap visibility every quarter, and continued focus on onboarding."),
            ("Vikram Singh", "Thanks everyone, good quarter overall."),
            ("Sara Thomas", "Agreed, looking forward to Q4."),
        ],
        topics=[
            SeedTopic("Q3 Outcomes Review", 0),
            SeedTopic("Sales & Customer Feedback", 3),
            SeedTopic("Lessons Learned", 6),
            SeedTopic("Process Improvements", 11),
        ],
        action_items=[
            SeedActionItem("Set up quarterly roadmap review with sales, marketing, and CS", "Anshika Chauhan", 5, "TODO"),
            SeedActionItem("Create scoping review process for inbound client requests", "Rahul Verma", 7, "TODO"),
            SeedActionItem("Share Q4 marketing content calendar with sales", "Neha Kapoor", 3, "TODO"),
        ],
        overview=(
            "Q3 delivered the transcript search feature and mobile redesign, contributing to four new "
            "enterprise deals and above-average email engagement, though the mobile redesign slipped two "
            "weeks due to unplanned SSO work. The team agreed to introduce a scoping review for inbound "
            "client requests and a standing quarterly roadmap review across sales, marketing and CS."
        ),
    ),
    SeedMeeting(
        title="Sales Strategy Discussion",
        description="Pipeline review and go-to-market alignment ahead of the analytics dashboard launch.",
        days_ago=10,
        duration_minutes=40,
        participants=["Vikram Singh", "Anshika Chauhan", "Neha Kapoor", "Sara Thomas"],
        tags=["sales", "strategy", "pipeline"],
        dialogue=[
            ("Vikram Singh", "Let's review the pipeline. We have six enterprise deals in the final stage, and the analytics dashboard is coming up in almost every conversation."),
            ("Anshika Chauhan", "Good to hear. When is the earliest close date among those six?"),
            ("Vikram Singh", "Two deals could close by end of next week if we can commit to the dashboard timeline in writing."),
            ("Anshika Chauhan", "We're targeting October 15th internally, so I'm comfortable sharing a mid-October date with prospects."),
            ("Sara Thomas", "From the customer success side, two of our existing accounts are also asking about the dashboard for their renewal conversations."),
            ("Vikram Singh", "That's helpful context. Renewals are easier when there's a clear roadmap story."),
            ("Neha Kapoor", "I noticed a competitor announced a similar analytics feature last week. We should make sure our positioning highlights the transcript search integration since they don't have that."),
            ("Vikram Singh", "Agreed, that's a real differentiator. Can marketing update the battlecard with that comparison?"),
            ("Neha Kapoor", "Yes, I'll have an updated competitive battlecard ready by Thursday."),
            ("Anshika Chauhan", "Let's also make sure sales has early access to the dashboard for demos before the public launch."),
            ("Vikram Singh", "That would be huge. Even a limited demo environment would help close deals faster."),
            ("Anshika Chauhan", "I'll coordinate with engineering to get a demo environment ready two weeks before launch."),
            ("Sara Thomas", "For renewals, would it help if I shared usage data showing how much time customers save with transcript search?"),
            ("Vikram Singh", "Definitely, that's compelling ROI data for renewal conversations."),
            ("Sara Thomas", "I'll pull that usage report together this week."),
            ("Vikram Singh", "One more item, we should revisit enterprise pricing since a couple of prospects pushed back on the current tier."),
            ("Anshika Chauhan", "Let's schedule a separate pricing review next week rather than deciding that today."),
            ("Vikram Singh", "Fair enough. Let's wrap here, good pipeline momentum overall."),
            ("Anshika Chauhan", "Agreed, thanks everyone."),
        ],
        topics=[
            SeedTopic("Pipeline Review", 0),
            SeedTopic("Competitive Positioning", 6),
            SeedTopic("Sales Enablement", 9),
            SeedTopic("Pricing Discussion", 15),
        ],
        action_items=[
            SeedActionItem("Update competitive battlecard with transcript search differentiator", "Neha Kapoor", 3, "TODO"),
            SeedActionItem("Set up early demo environment for sales before dashboard launch", "Anshika Chauhan", 9, "TODO"),
            SeedActionItem("Pull usage data report for renewal conversations", "Sara Thomas", 4, "IN_PROGRESS"),
            SeedActionItem("Schedule enterprise pricing review", "Anshika Chauhan", 6, "TODO"),
        ],
        overview=(
            "Sales reviewed six enterprise deals in final stage, with two potentially closing next week if "
            "the analytics dashboard timeline is confirmed. The team agreed to update the competitive "
            "battlecard to highlight the transcript search differentiator, set up an early sales demo "
            "environment, and pull renewal usage data, while pricing was deferred to a dedicated review."
        ),
    ),
]
