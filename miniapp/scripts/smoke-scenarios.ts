import { buildQuizRuntime, type QuizSubmission } from '../src/data/quiz-runtime'

type Scenario = {
  id: string
  label: string
  submission: QuizSubmission
}

const scenarios: Scenario[] = [
  {
    id: 'S1',
    label: '财政党员四川防御',
    submission: {
      answers: {
        1: 'dangzheng',
        2: 'yes',
        3: 'sichuan',
        4: 'full_time_bachelor',
        5: '31-35',
        6: 'defensive',
        7: '财政发改',
        8: '5-8w',
        9: ['english_concern']
      },
      dpAnswers: {
        L1: 'untested',
        L2: 'no_hard_requirement',
        L3: 'liberal_thinking'
      }
    }
  },
  {
    id: 'S2',
    label: '医疗职称双证重庆',
    submission: {
      answers: {
        1: 'medical',
        2: 'no',
        3: 'chongqing',
        4: 'full_time_bachelor',
        5: '31-35',
        6: 'zhicheng',
        7: '医护',
        8: '5-8w',
        9: ['exam_concern']
      },
      dpAnswers: {
        L1: 'tested',
        L2: 'must_dual_degree',
        L3: 'science_thinking'
      }
    }
  },
  {
    id: 'S3',
    label: '国企管理岗低预算防御',
    submission: {
      answers: {
        1: 'guoqi',
        2: 'yes',
        3: 'sichuan',
        4: 'full_time_bachelor',
        5: '31-35',
        6: 'defensive',
        7: '管理岗',
        8: '2-3w',
        9: ['budget_concern']
      },
      dpAnswers: {
        L1: 'tested',
        L2: 'no_hard_requirement',
        L3: 'science_thinking'
      }
    }
  },
  {
    id: 'S4',
    label: '公检法遴选重庆',
    submission: {
      answers: {
        1: 'gongjianfa',
        2: 'yes',
        3: 'chongqing',
        4: 'full_time_bachelor',
        5: '31-35',
        6: 'lianxuan',
        7: '法院检察院',
        8: '5-8w',
        9: ['no_concern']
      },
      dpAnswers: {}
    }
  },
  {
    id: 'S5',
    label: '乡镇年轻党员低预算',
    submission: {
      answers: {
        1: 'xiangzhen',
        2: 'yes',
        3: 'sichuan',
        4: 'full_time_bachelor',
        5: '25-30',
        6: 'defensive',
        7: '社区村镇管理',
        8: '2-3w',
        9: ['no_concern']
      },
      dpAnswers: {}
    }
  }
]

const summaries = scenarios.map(item => {
  const runtime = buildQuizRuntime(item.submission)
  return {
    id: item.id,
    label: item.label,
    profile: runtime.presentation.profile,
    primaryRule: runtime.recommendation.strategyId,
    primaryPath: runtime.recommendation.primaryPath,
    primarySchool: runtime.presentation.recommendation.title,
    backupPath: runtime.recommendation.secondaryOption?.primaryPath || '',
    backupSchool: runtime.presentation.backup.title,
    similarCase: runtime.presentation.similarCase,
    knn: runtime.presentation.knn,
    compareBars: runtime.presentation.compareBars,
    stories: runtime.presentation.stories,
    riskItems: runtime.presentation.riskItems,
    weeklyPlan: runtime.presentation.weeklyPlan,
    zexiao: runtime.zexiao
  }
})

console.log(JSON.stringify(summaries, null, 2))
