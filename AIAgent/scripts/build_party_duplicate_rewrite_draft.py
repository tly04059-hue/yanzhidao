from __future__ import annotations

import html
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "miniapp" / "dx-cases.json"
OUTPUT = ROOT / "studentCases" / "reports" / "party-duplicate-rewrite-draft.html"


def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def escape(value: Any) -> str:
    return html.escape(clean(value), quote=True)


def compact_tags(*groups: list[str] | None) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for group in groups:
        for item in group or []:
            tag = clean(item)
            if not tag or tag in {"其他", "M8-resync", "system_unknown_storied"}:
                continue
            if tag not in seen:
                seen.add(tag)
                result.append(tag)
    return result


def major(case: dict[str, Any]) -> str:
    target = clean(case.get("chosen_school"))
    if "·" in target:
        return clean(target.split("·")[-1])
    for value in compact_tags(case.get("story_tags"), case.get("tags")):
        if value.startswith("党校"):
            return value.replace("党校", "")
    return "党校"


def system_label(case: dict[str, Any]) -> str:
    system = clean(case.get("system"))
    if not system or system == "system_unknown_storied":
        system = clean(case.get("system_chip") or case.get("unit_narrative"))
    if not system or system in {"其他", "M8-resync", "system_unknown_storied"}:
        return "在职"
    return system


def has(case: dict[str, Any], keyword: str) -> bool:
    text = " ".join(
        [
            clean(case.get("key_quote")),
            clean(case.get("story_summary")),
            " ".join(compact_tags(case.get("story_tags"), case.get("tags"), case.get("reason_tags"), case.get("reason_keywords"))),
        ]
    )
    return keyword in text


def status_phrase(case: dict[str, Any]) -> str:
    return "已经上岸" if clean(case.get("outcome")) == "上岸" else "这次没有上岸"


def pick(case: dict[str, Any], options: list[str]) -> str:
    seed = clean(case.get("case_id")) or clean(case.get("display_name")) or "case"
    index = stable_hash(seed) % len(options)
    return options[index]


def stable_hash(value: str) -> int:
    result = 0
    for char in value:
        result = (result * 131 + ord(char)) % 1_000_000_007
    return result


def seed_value(case: dict[str, Any], salt: str = "") -> int:
    seed = f"{clean(case.get('case_id')) or clean(case.get('display_name')) or 'case'}:{salt}"
    return stable_hash(seed)


def maybe_expand(case: dict[str, Any], text: str, kind: str) -> str:
    if len(text) >= 55 or seed_value(case, kind) % 5 not in {1, 3}:
        return text

    extras = {
        "choose": [
            "有人提醒进度，自己就不容易拖着不动。",
            "资料先帮我筛过，复习时心里更有底。",
            "老师把重点讲清楚，晚上学起来没那么慌。",
            "跟着班级安排走，比自己硬撑更容易坚持。",
            "遇到卡点能问老师，心态也会稳很多。",
        ],
        "feedback": [
            "这次复盘之后，后面知道该先补哪一块。",
            "哪怕结果一般，也比以前更清楚下一步怎么学。",
            "把问题看明白了，后面准备就不会再乱抓。",
            "只要每天能接着往前推，下一次就会更有把握。",
            "这段经历至少让我知道，不能再靠临时硬扛。",
            "把短板拆开来看，后面复习就不再一团乱。",
            "知道问题在哪里，下一次就能更早调整方法。",
            "这次踩过的坑，后面都会变成提醒自己的经验。",
            "先把基础补起来，再上考场心里就不会那么虚。",
            "下次再准备，会更早进入状态，也更敢坚持到底。",
            "这次没做到的地方，后面就从最基础的计划开始补。",
            "把该补的地方列出来，比一直焦虑有用得多。",
            "下次会先把每天的小任务完成，不再等到最后才追。",
            "这次留下的遗憾，也会提醒我后面别再拖到考前。",
            "看清自己的问题后，反而知道该怎么往前走了。",
            "后面再学，会先把基础题和核心考点吃透。",
            "这次至少让我明白，备考不能只停在想法里。",
            "后面会把时间拆小，不再等完全空下来才开始。",
            "能复盘出问题，下一次就不是从零开始。",
            "这次经验留下来，后面准备会更有章法。",
        ],
    }
    extra_index = seed_value(case, f"{kind}-extra") % len(extras[kind])
    extra = extras[kind][extra_index]
    expanded = f"{text}{extra}"
    return expanded if len(expanded) <= 78 else text


def maybe_add_thanks(case: dict[str, Any], text: str) -> str:
    if seed_value(case, "thanks") % 5 != 2:
        return text
    teacher_options = ["杨老师", "吴老师", "胡老师", "林老师", "吴老师", "魏老师", "姚老师", "黎老师", "杨老师", "吴老师", "胡老师"]
    teacher = teacher_options[seed_value(case, "teacher") % len(teacher_options)]
    thanks_options = [
        f"也很感谢{teacher}一路提醒，把我从拖延里拉回来。",
        f"后来想想，能被{teacher}一直提醒，真的挺重要。",
        f"谢谢{teacher}把重点讲明白，也把我的方向拉清楚了。",
        f"这一路有{teacher}答疑和鼓励，心里确实踏实很多。",
        f"有{teacher}盯着进度，自己就不敢轻易放掉。",
        f"很感谢{teacher}一直提醒，焦虑的时候也有人接住。",
    ]
    thanks = pick(case, thanks_options)
    expanded = f"{text}{thanks}"
    return expanded if len(expanded) <= 90 else text


def age_label(case: dict[str, Any]) -> str:
    return clean(case.get("age_concrete") or case.get("age_band")).replace(" 岁段", "岁段") or "在职阶段"


def place_or_system(case: dict[str, Any]) -> str:
    region = clean(case.get("region"))
    if region and region != "未知":
        return region
    system = system_label(case)
    if system != "在职":
        return system
    return "现在的岗位"


def base_choose_reason(case: dict[str, Any]) -> str:
    region = clean(case.get("region"))
    system = system_label(case)
    outcome = clean(case.get("outcome"))

    if has(case, "宝妈") or "妈妈" in clean(case.get("key_quote")):
        return pick(
            case,
            [
                "时间被工作和孩子切得很碎，选研知道就是看中老师能把计划拆细、带着走。",
                "带娃后很难完整学习，所以更需要研知道这种有人提醒、有节奏的陪伴式备考。",
                "自己一个人容易被家务打断，选择研知道，是想让老师帮我把重点和时间都管起来。",
                "当妈妈以后更怕瞎学浪费时间，研知道的资料和带背能让我少走很多弯路。",
            ],
        )
    if has(case, "二战") or "二战" in clean(case.get("key_quote")):
        return pick(
            case,
            [
                "前一次吃过自己乱学的亏，这次选研知道，是想让老师帮我把重点重新抓准。",
                "二战不想再靠感觉硬背，研知道的框架、带背和模考能让我心里更有底。",
                "已经知道自己短板在哪，就更需要研知道老师把方法讲透、把节奏拉住。",
                "再考一次压力不小，选择研知道，是想有人带着复盘错题、少重复上次的坑。",
            ],
        )
    if has(case, "民族地区") or region in {"甘孜", "阿坝", "凉山"}:
        place = region or "民族地区"
        return pick(
            case,
            [
                f"在{place}工作，时间和距离都不宽裕，研知道线上课程和打卡节奏更适合我。",
                f"{place}这边事务多，自己学容易散，选研知道是想跟着老师把重点一步步过完。",
                f"平时在{place}忙具体工作，研知道把考点和资料整理好，能省下很多摸索时间。",
                f"身在{place}，备考不能总等整块时间，研知道的带背和回放让我能跟上节奏。",
                f"{place}工作节奏不轻松，选择研知道，是看中老师能把复杂内容讲得更好入口。",
                f"在{place}边工作边备考，最需要有人帮我抓重点，研知道正好能把方向理清。",
            ],
        )
    if "民政" in system:
        return pick(
            case,
            [
                "民政工作事情细又杂，选研知道是想让老师帮我把有限时间用在重点上。",
                "平时被具体事务占满，自己看书很容易散，研知道的资料和督学更能拉住我。",
                "民政岗位很难有固定学习时间，所以更需要研知道把课程、题库和背诵节奏排好。",
                "工作越忙越怕盲学，选择研知道，就是想跟着老师少绕弯、学得更稳一点。",
            ],
        )
    if "政法" in system:
        return pick(
            case,
            [
                "政法内容理论性强，选研知道是因为老师能把框架讲清楚，不用自己瞎抓重点。",
                "平时工作离不开材料和理论，研知道的带背和考点梳理让我学起来更有章法。",
                f"在{system}岗位上备考，最怕背得散，研知道的框架课能帮我把知识串起来。",
                "选择研知道，是看中老师既讲考点，也讲答题思路，临场不会只会死背。",
            ],
        )
    if "医院" in system or "医疗" in system:
        return pick(
            case,
            [
                "医院工作下班后精力有限，选研知道就是想让资料更聚焦、老师带着学更省力。",
                "医务岗位很难有整块时间，研知道的回放、带背和题库能让我碎片化跟上。",
                "白天已经很累，自己啃书容易放弃，研知道老师的节奏能把我重新拉回学习里。",
                "选择研知道，是因为课程把复杂理论讲得更顺，我下班后也能听得进去。",
            ],
        )
    if "教育" in system or "高校" in system:
        return pick(
            case,
            [
                "平时也和学习打交道，轮到自己备考时，更想找研知道这种有体系的老师带。",
                "教育系统工作不轻松，研知道把重点、讲义和带背整理好，能让我少走弯路。",
                "自己一个人容易停在计划上，选择研知道，是想借老师和班级节奏逼自己动起来。",
                "看中研知道的不只是资料，还有老师把知识讲透、把学习节奏稳住的能力。",
            ],
        )
    if "国企" in system or "央企" in system:
        return pick(
            case,
            [
                f"在{system}工作时间被切得很碎，选研知道是想用核心资料和带背提高效率。",
                "单位工作稳定但要求也在变，研知道的课程和模考能让我更快进入备考状态。",
                "自己看书容易拖，选择研知道，是想让老师用计划和题库把节奏带起来。",
                "选研知道不是跟风，是看中它把考点、讲义和练习都配好了，适合在职备考。",
            ],
        )
    if "基层" in system:
        return pick(
            case,
            [
                "基层工作忙起来没整块时间，研知道把重点拆好，我才能跟着一点点往前走。",
                "一线事情多又杂，自己复习容易乱，选择研知道是想有人帮我抓主线。",
                "基层备考最怕没方向，研知道的核心考点和带背能让我少做无用功。",
                "工作服务期里时间紧，研知道这种课程、资料、督学一起上的方式更适合我。",
            ],
        )
    if outcome == "未上岸":
        return pick(
            case,
            [
                "当时选择研知道，是想让老师帮我把方向理清，只是自己后面节奏没完全跟住。",
                "报班是因为知道自己自学容易散，研知道的资料和督学至少让我看清了方向。",
                "一开始就知道不能只靠自己硬扛，所以才想借研知道的老师和课程往前推。",
                "虽然这次没走到最后，但选择研知道，确实让我知道后面该怎么准备。",
            ],
        )
    return pick(
        case,
        [
            "选择研知道，是因为自己一个人很难坚持，老师和班级节奏能把我带起来。",
            "我最看重研知道把考点、讲义、题库都整理好了，在职备考不用自己乱摸索。",
            "平时忙归忙，但有老师提醒、有资料可跟，学习这件事就不容易被放掉。",
            "选择研知道，是想让专业老师帮我抓重点，少走弯路，也少一点焦虑。",
            "自己看书容易散，研知道的带背、模考和督学能让我一步一步跟上。",
            "在职备考时间太碎，研知道把学习任务拆清楚，执行起来更现实。",
            "我需要的不只是资料，更是有人讲清楚、有人督促、有人帮我稳住节奏。",
            "选研知道，是因为老师讲得细，资料也聚焦，适合我这种边上班边备考的人。",
        ],
    )


def choose_reason(case: dict[str, Any]) -> str:
    return maybe_add_thanks(case, maybe_expand(case, base_choose_reason(case), "choose"))


def base_feedback(case: dict[str, Any]) -> str:
    region = clean(case.get("region"))
    system = system_label(case)
    outcome = clean(case.get("outcome"))

    if outcome != "上岸":
        if has(case, "专业班") or "没坚持" in clean(case.get("key_quote")):
            return pick(
                case,
                [
                    "这次节奏没有跟到底，但也看清了问题，后面再准备会更有方向。",
                    "中途断了节奏确实吃力，但知道短板在哪里，下次就能更早调整。",
                    "这次被拖延影响了状态，但也提醒自己，持续投入比临时冲刺更重要。",
                    "没坚持完整确实可惜，但这次复盘清楚了，下一次会更有把握。",
                    "前面漏掉的内容会变成压力，但能提前发现问题，本身也是一种收获。",
                    "工作一忙学习就容易被冲散，但至少知道了，备考要先把时间留出来。",
                    "如果再来一次，会更早把学习安排好，这次的经验不会白费。",
                    "执行断断续续差了一口气，但方法已经摸到，后面会更有底气。",
                ],
            )
        return pick(
            case,
            [
                "这次结果不理想，但问题已经看清，后面再准备会少走很多弯路。",
                "没上岸不代表没收获，至少知道自己卡在哪里，下一步更清楚。",
                "准备不够连续影响了结果，但复盘之后，心态反而更踏实了。",
                "这次给自己敲了警钟，也让我知道，下次要更早进入状态。",
                "结果没有达到预期，但真正考过一次，后面就不会再凭感觉准备。",
                "这次没走到最后有遗憾，但也更清楚，下一次该从哪里补起。",
                "落到卷面上才知道差距，但看见差距，就有了继续往前的方向。",
                "问题暴露出来也好，后面再准备，就能把力气用在更关键的地方。",
                "没上岸确实难受，但比起空想，这次至少摸清了考试的门道。",
                "复盘后才明白，持续投入最关键，这个教训会变成下一次的底气。",
            ],
        )
    if has(case, "宝妈") or "妈妈" in clean(case.get("key_quote")):
        return pick(
            case,
            [
                "真正坚持下来才发现，妈妈的时间都是挤出来的，但每晚多学一点都算数。",
                "白天顾工作，晚上顾孩子，能坚持下来，靠的就是不把自己放弃掉。",
                "以前总觉得没时间，后来才发现，只要想学，十点后的书桌也算起点。",
                "这段备考让我知道，妈妈不是不能学习，只是要比别人更会挤时间。",
            ],
        )
    if has(case, "二战") or "二战" in clean(case.get("key_quote")):
        return pick(
            case,
            [
                "第二次备考更知道自己差在哪里，方法对了之后，心里会踏实很多。",
                "经历过一次失利后，才知道不能只靠蛮劲，方向和方法都要重新调整。",
                "二战最明显的变化，是不再乱抓重点，知道该把力气用在哪里。",
                "再考一次压力不小，但把上次的坑避开后，心里反而更有底了。",
            ],
        )
    if has(case, "民族地区") or region in {"甘孜", "阿坝", "凉山"}:
        return pick(
            case,
            [
                "民族地区工作不轻松，能上岸更多靠的是把零碎时间一点点用起来。",
                "真正学下来才发现，地方远不远不是关键，关键是每天别把学习放下。",
                "平时事务很多，能走到最后，靠的不是一下子爆发，而是慢慢攒进度。",
                "这一路不算轻松，但把每天能学的那点时间抓住，结果就会有变化。",
                f"在{region or '民族地区'}备考，最现实的办法就是别等整块时间，先学起来。",
                "工作和路程都会消耗人，但只要每天不断一点，最后还是能看到变化。",
                "以前总觉得条件不够好，真正开始后才发现，持续跟上比想太多更重要。",
                f"在{region or '民族地区'}备考不算轻松，但这次让我相信慢慢学也能走到岸上。",
                "很多时候不是时间够了才学，而是先开始学，时间才会一点点挤出来。",
                "这次最大的收获，是发现只要方向对，零散的时间也能慢慢攒成进度。",
                f"在{region or '民族地区'}边工作边学，确实累，但坚持下来后心里很踏实。",
                "备考过程没有想象中顺，但每天往前一点，最后真的会有结果。",
            ],
        )
    if "民政" in system:
        return pick(
            case,
            [
                "民政工作忙起来没有固定下班点，能坚持到最后，靠的是把碎片时间抓住。",
                "每天事情都很细，备考后才发现，越忙越需要提前把学习时间留出来。",
                "这次最大的感受是，工作再琐碎，也要给学习留一点固定位置。",
                "基层事务不会等人，学习也不能一直等有空，很多进度都是挤出来的。",
            ],
        )
    if "政法" in system:
        return pick(
            case,
            [
                "政法岗位平时就要接触很多理论和材料，学起来虽然累，但方向是对的。",
                "学政治学时能和工作里的材料、思路对上，后面坚持起来就没那么虚。",
                "真正复盘后才发现，岗位和专业能对上，学习就不只是为了考试。",
                "这次上岸让我更确定，平时工作里用得到的东西，学起来会更有劲。",
            ],
        )
    if "医院" in system or "医疗" in system:
        return pick(
            case,
            [
                "医院工作本来就紧，备考时最难的是下班后还要把自己重新拉回书桌前。",
                "白天已经很累，晚上还能打开书，本身就是这段备考最难的一步。",
                "这次让我知道，在职备考不是拼谁时间多，而是谁能把状态找回来。",
                "医务工作强度大，能坚持学习下来，对自己也是一次重新证明。",
            ],
        )
    if "教育" in system or "高校" in system:
        return pick(
            case,
            [
                "做教育工作的人更知道学习不能停，这次上岸也算给自己一个交代。",
                "平时总在要求别人学习，这次轮到自己，才知道坚持其实也不容易。",
                "备考过程让我重新体会到，学习这件事不能只停留在口头上。",
                "这次结果给了我一个提醒，自己也要一直保持学习的状态。",
            ],
        )
    if "国企" in system or "央企" in system:
        return pick(
            case,
            [
                "在单位里待久了会更明白，学历和学习能力都是给未来留余地。",
                "工作稳定不代表可以停下，真正备考后才发现自己还有很多能补的地方。",
                "这次学习不是为了立刻改变什么，而是给以后的职业发展多一点准备。",
                "单位工作越久，越能感觉到持续学习的重要，不能一直吃老本。",
            ],
        )
    if "基层" in system:
        return pick(
            case,
            [
                "基层事情多，但越是这样，越要把学习拆小，一点点往前推。",
                "一线工作很难等到完全空下来，能上岸靠的是边忙边把学习接上。",
                "这次最大的体会是，基层备考不能等有空，能学一点就要先学一点。",
                "每天的事情都不确定，反而更需要把学习安排得简单、固定、能执行。",
            ],
        )
    return pick(
        case,
        [
            "这次最大的感受是，在职备考不能只靠热情，要把每天该做的事情落下去。",
            f"真正准备过才知道，{age_label(case)}学习也不是晚，只是要比以前更自觉。",
            "上岸以后回头看，最有用的不是焦虑，而是把每天该做的事情做完。",
            "这段经历让我更确定，成年人学习不容易，但开始了就会有变化。",
            f"在{place_or_system(case)}边工作边学，最难的是持续，但最有用的也是持续。",
            "备考时每天都不轻松，可真的坚持下来，会发现自己比想象中能扛。",
            "以前总觉得没时间，真正开始后才知道，时间都是一点点挤出来的。",
            f"这次结果让我踏实了一点，至少证明{age_label(case)}也还能重新学进去。",
            "回头看，真正有用的是那些不起眼的重复，听课、背书、做题都不能省。",
            "这次备考让我知道，成年人学习拼的不是热闹，而是能不能持续执行。",
            f"在{place_or_system(case)}工作再忙，也不能把学习完全放掉，这是我最大的感受。",
            "上岸不是突然发生的，前面那些零碎又普通的坚持，最后都会算数。",
            "这段经历让我对自己多了一点信心，原来工作以后也还能重新学进去。",
            "真正走完一遍才知道，焦虑解决不了问题，把任务一件件完成才最有用。",
        ],
    )


def feedback(case: dict[str, Any]) -> str:
    return maybe_expand(case, base_feedback(case), "feedback")


def duplicate_cases(cases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    result = []
    for case in cases:
        if clean(case.get("chosen_path")) != "A":
            continue
        values = [clean(case.get("key_quote")), clean(case.get("narrative_choose")), clean(case.get("reflection"))]
        if all(values) and len(set(values)) == 1:
            result.append(case)
    return result


def render(cases: list[dict[str, Any]]) -> str:
    rows = []
    for index, case in enumerate(cases, start=1):
        tags = compact_tags(case.get("story_tags"), case.get("tags"), case.get("reason_tags"), case.get("reason_keywords"))
        rows.append(
            f"""
            <article class="card">
              <div class="meta">#{index:03d} · {escape(case.get('case_id'))} · {escape(case.get('display_name'))} · {escape(case.get('age_concrete') or case.get('age_band'))} · {escape(case.get('region'))} · {escape(system_label(case))}</div>
              <h2>{escape(case.get('chosen_school'))} · {escape(case.get('outcome'))}</h2>
              <div class="tags">{''.join(f'<span>{escape(tag)}</span>' for tag in tags)}</div>
              <section>
                <h3>原重复文本</h3>
                <p>{escape(case.get('key_quote'))}</p>
              </section>
              <section class="draft">
                <h3>建议选择原因</h3>
                <p>{escape(choose_reason(case))}</p>
              </section>
              <section class="draft">
                <h3>建议真实反馈</h3>
                <p>{escape(feedback(case))}</p>
              </section>
              <section class="basis">
                <h3>依据字段</h3>
                <p>{escape(case.get('story_summary'))}</p>
              </section>
            </article>
            """
        )
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>党校重复字段改写草稿</title>
  <style>
    :root {{ --paper:#fffaf1; --ink:#4d4037; --muted:#8b7768; --accent:#c76532; --line:#ead7c2; }}
    body {{ margin:0; background:linear-gradient(135deg,#fffaf1,#f4eadc); color:var(--ink); font:16px/1.7 "Songti SC","STSong","Noto Serif SC",serif; }}
    main {{ max-width:1040px; margin:0 auto; padding:32px 18px 64px; }}
    header {{ margin-bottom:24px; padding:24px; background:#fff; border:1px solid var(--line); border-radius:22px; box-shadow:0 16px 36px rgba(122,80,42,.08); }}
    h1 {{ margin:0 0 8px; color:var(--accent); font-size:30px; }}
    .note {{ color:var(--muted); margin:0; }}
    .card {{ margin:18px 0; padding:22px 24px; background:#fff; border:1px solid var(--line); border-radius:20px; box-shadow:0 12px 30px rgba(122,80,42,.07); }}
    .meta {{ color:var(--accent); font-weight:700; }}
    h2 {{ margin:6px 0 12px; font-size:22px; }}
    h3 {{ margin:16px 0 6px; font-size:17px; color:var(--accent); }}
    p {{ margin:0; }}
    .tags {{ display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 12px; }}
    .tags span {{ padding:4px 10px; border-radius:999px; background:#f2e6d7; color:#6b584b; font-size:14px; }}
    section {{ border-top:1px dashed var(--line); padding-top:10px; margin-top:10px; }}
    .draft {{ background:#fff8ed; border:1px solid #f0ddc8; border-radius:14px; padding:12px 14px; }}
    .basis {{ color:var(--muted); }}
  </style>
</head>
<body>
  <main>
    <header>
      <h1>党校重复字段改写草稿</h1>
      <p class="note">生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}。这里只是审核稿，不写入正式 JSON。规则：选择原因聚焦“为什么选择研知道辅助学习”，真实反馈保留复盘感和正向转折；只基于已有地区、年龄、岗位、专业、结果和标签生成。</p>
      <p class="note">待改写案例：{len(cases)} 条。</p>
    </header>
    {''.join(rows)}
  </main>
</body>
</html>
"""


def main() -> None:
    payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    cases = duplicate_cases(payload.get("data", {}).get("cases", []))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(render(cases), encoding="utf-8")
    print(f"wrote {OUTPUT.relative_to(ROOT)}")
    print(f"duplicate_cases={len(cases)}")


if __name__ == "__main__":
    main()
