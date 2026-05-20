// assessment_questions_v2.js - 调整后的8题测评配置

export const QUESTIONS_V2 = [
  {
    id: 1,
    question: "你今年多大?",
    subtitle: "年龄会影响选择全日制还是非全日制,以及是否适合党校系统",
    field_name: "age",
    options: [
      { 
        value: "25-28岁", 
        label: "25-28岁", 
        hint: "职业上升期,可全职/非全",
        tag: "age_25_28"
      },
      { 
        value: "28-32岁", 
        label: "28-32岁", 
        hint: "非全日制黄金年龄段",
        tag: "age_28_32"
      },
      { 
        value: "32-35岁", 
        label: "32-35岁", 
        hint: "在职读研最适合年龄",
        tag: "age_32_35"
      },
      { 
        value: "35岁以上", 
        label: "35岁以上", 
        hint: "建议考虑党校/免联考",
        tag: "age_35_plus"
      }
    ]
  },
  
  {
    id: 2,
    question: "你目前的职务类型?",
    subtitle: "不同职务对应不同的适合路径",
    field_name: "position",
    options: [
      { 
        value: "公务员", 
        label: "公务员", 
        hint: "最常见 · MPA/党校都适合",
        tag: "position_gov"
      },
      { 
        value: "事业编", 
        label: "事业单位", 
        hint: "MPA/同等学力都可",
        tag: "position_institution"
      },
      { 
        value: "国企", 
        label: "国企/央企", 
        hint: "MBA更对口",
        tag: "position_soe"
      },
      { 
        value: "其他", 
        label: "民企/其他", 
        hint: "MBA通用性强",
        tag: "position_private"
      }
    ]
  },
  
  {
    id: 3,
    question: "你的当前学历?",
    subtitle: "大专需要加试,本科可直接报考",
    field_name: "education",
    options: [
      { 
        value: "大专", 
        label: "大专", 
        hint: "可考但需加试",
        tag: "education_junior"
      },
      { 
        value: "本科", 
        label: "本科", 
        hint: "最适合在职读研",
        tag: "education_bachelor"
      },
      { 
        value: "硕士", 
        label: "已有硕士", 
        hint: "可再读一个",
        tag: "education_master"
      }
    ]
  },
  
  {
    id: 4,
    question: "你的预算大概多少?",
    subtitle: "不同院校学费差异很大,从2.4万到21万不等",
    field_name: "budget",
    options: [
      { 
        value: "4万以内", 
        label: "4万以内", 
        hint: "党校系 · 2.4-3.5万",
        tag: "budget_0_40k",
        range: [0, 40000]
      },
      { 
        value: "4-7万", 
        label: "4-7万", 
        hint: "211性价比档 · 4.6-6.9万",
        tag: "budget_40_70k",
        range: [40000, 70000]
      },
      { 
        value: "7-9万", 
        label: "7-9万", 
        hint: "985 MPA档 · 8.4万",
        tag: "budget_70_90k",
        range: [70000, 90000]
      },
      { 
        value: "9-16万", 
        label: "9-16万", 
        hint: "MBA档 · 10-15万",
        tag: "budget_90_160k",
        range: [90000, 160000]
      },
      { 
        value: "16万以上", 
        label: "16万以上", 
        hint: "顶级MBA · 18-22万",
        tag: "budget_160k_plus",
        range: [160000, 999999]
      }
    ]
  },
  
  {
    id: 5,
    question: "你考研最主要的目的?",
    subtitle: "不同目的对应不同路径,这题帮我们判断双证 vs 单证的权重",
    field_name: "goal",
    has_followup: true,
    options: [
      { 
        value: "提拔", 
        label: "满足提拔 / 遴选硬条件", 
        hint: "最常见 · 体制内硬要求",
        tag: "goal_promotion",
        // 子问题
        followup: {
          question: "对学校的要求?",
          options: [
            {
              value: "必须985名校",
              label: "必须985名校",
              hint: "川大、电子科大、重大",
              tag: "goal_strong"
            },
            {
              value: "211也可以",
              label: "211也可以",
              hint: "川农、西财、川师等",
              tag: "goal_medium"
            },
            {
              value: "只要证书就行",
              label: "只要证书就行",
              hint: "性价比优先,好上岸",
              tag: "goal_weak"
            }
          ]
        }
      },
      { 
        value: "保底", 
        label: "拿学历做长期保底", 
        hint: "不一定立即用,但要有",
        tag: "goal_backup"
      },
      { 
        value: "转岗", 
        label: "转岗 / 跨界拓宽空间", 
        hint: "想从乡镇调到市直",
        tag: "goal_transfer"
      },
      { 
        value: "镀金", 
        label: "补一个学历短板", 
        hint: "本科普通批 / 想再镀金",
        tag: "goal_prestige"
      }
    ]
  },
  
  {
    id: 6,
    question: "你能投入的时间?",
    subtitle: "不同路径需要的备考时间差异很大",
    field_name: "time",
    options: [
      { 
        value: "充足", 
        label: "时间充足", 
        hint: "每周>10小时",
        tag: "time_abundant"
      },
      { 
        value: "有限", 
        label: "周末有时间", 
        hint: "每周6-8小时",
        tag: "time_limited"
      },
      { 
        value: "紧张", 
        label: "时间非常紧张", 
        hint: "每周<4小时",
        tag: "time_tight"
      }
    ]
  },
  
  {
    id: 7,
    question: "对于联考的态度?",
    subtitle: "这题决定推荐管综系还是党校系",
    field_name: "exam_willingness",
    options: [
      { 
        value: "可以考", 
        label: "可以考试", 
        hint: "愿意花时间备考",
        tag: "exam_willing",
        difficulty_tag: "difficulty_medium"
      },
      { 
        value: "中立", 
        label: "不确定", 
        hint: "看难度再决定",
        tag: "exam_neutral",
        difficulty_tag: "difficulty_easy"
      },
      { 
        value: "不想考", 
        label: "不想考试", 
        hint: "只考虑免联考",
        tag: "exam_unwilling",
        difficulty_tag: "difficulty_easy"
      }
    ]
  },
  
  {
    id: 8,
    question: "地理位置偏好?",
    subtitle: "本地上课更方便,但选择有限",
    field_name: "location",
    options: [
      { 
        value: "本地", 
        label: "必须本地", 
        hint: "成都/重庆本市",
        tag: "location_local"
      },
      { 
        value: "本省", 
        label: "本省都可以", 
        hint: "川渝省内",
        tag: "location_province"
      },
      { 
        value: "邻省", 
        label: "邻省可接受", 
        hint: "西南地区",
        tag: "location_neighbor"
      },
      { 
        value: "不限", 
        label: "不限地点", 
        hint: "全国都可",
        tag: "location_remote"
      }
    ]
  }
];

// 从用户答案提取标签的函数
export function extractTagsFromAnswers(answers) {
  const tags = [];
  
  // Q1-Q4, Q6-Q8: 直接从选项中提取tag
  for (let i = 1; i <= 8; i++) {
    if (i === 5) continue; // Q5特殊处理
    
    const questionId = `q${i}`;
    const answer = answers[questionId];
    
    const question = QUESTIONS_V2.find(q => q.id === i);
    const option = question.options.find(opt => opt.value === answer);
    
    if (option && option.tag) {
      tags.push(option.tag);
      
      // Q7考试态度额外提取难度标签
      if (i === 7 && option.difficulty_tag) {
        tags.push(option.difficulty_tag);
      }
    }
  }
  
  // Q5特殊处理(有子问题)
  const q5_answer = answers.q5;
  const q5_followup = answers.q5_followup;
  
  const q5 = QUESTIONS_V2.find(q => q.id === 5);
  const q5_option = q5.options.find(opt => opt.value === q5_answer);
  
  if (q5_option && q5_option.tag) {
    tags.push(q5_option.tag);
    
    // 提取子问题标签
    if (q5_followup && q5_option.followup) {
      const followup_option = q5_option.followup.options.find(
        opt => opt.value === q5_followup
      );
      if (followup_option && followup_option.tag) {
        tags.push(followup_option.tag);
      }
    }
  }
  
  return tags;
}

// 使用示例
/*
const userAnswers = {
  q1: "32-35岁",
  q2: "公务员",
  q3: "本科",
  q4: "7-9万",
  q5: "提拔",
  q5_followup: "必须985名校",  // 子问题答案
  q6: "有限",
  q7: "可以考",
  q8: "本地"
};

const tags = extractTagsFromAnswers(userAnswers);
// 输出: ["age_32_35", "position_gov", "education_bachelor", "budget_70_90k", 
//        "goal_promotion", "goal_strong", "time_limited", "exam_willing", 
//        "difficulty_medium", "location_local"]
*/
