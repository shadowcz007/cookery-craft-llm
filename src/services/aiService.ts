import axios from 'axios';
import { ingredients } from '../data/ingredients';

// 硅基流动API配置
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY || '';

// 定义生成菜谱的接口
export interface GeneratedRecipe {
  name: string;
  ingredients: {
    id: string;
    amount: string;
  }[];
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  time: number;
  tips: string[];
}

/**
 * 根据选定的食材生成创意菜谱
 * @param ingredientIds 选定的食材ID数组
 * @param ingredientNames 选定的食材名称数组
 * @returns 生成的菜谱
 */
export async function generateRecipe(
  ingredientIds: string[],
  ingredientNames: string[]
): Promise<GeneratedRecipe> {
  try {
    // 构建提示词
    const prompt = `
    作为一名专业厨师，请根据以下食材创建一道创意菜谱：
    ${ingredientNames.join('、')}
    
    请提供以下格式的菜谱信息：
    1. 菜名（创意且吸引人的中文名称）
    2. 所需食材和用量（只使用提供的食材，可以添加基本调料）
    3. 详细的烹饪步骤（5-8个步骤）
    4. 难度（easy、medium或hard）
    5. 预计烹饪时间（分钟）
    6. 2-3条烹饪小贴士
    
    请以JSON格式返回，格式如下：
    {
      "name": "菜名",
      "ingredients": [
        {"name": "食材名称", "amount": "用量"}
      ],
      "steps": ["步骤1", "步骤2", ...],
      "difficulty": "easy/medium/hard",
      "time": 30,
      "tips": ["小贴士1", "小贴士2", ...]
    }
    
    不要有任何额外的文字，确保JSON格式正确。
    `;

    // 调用API
    const response = await axios.post(
      API_URL,
      {
        model: 'THUDM/glm-4-9b-chat', // 使用 GLM-4 模型
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: {
          type: 'json_object'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 解析返回的JSON
    const content = response.data.choices[0].message.content;
    const recipeData = JSON.parse(content);
    console.log('API返回的数据:', recipeData);
    
    // 处理返回的数据，确保格式正确
    const recipe: GeneratedRecipe = {
      name: recipeData.name || `AI创意料理：${ingredientNames[0]}${ingredientNames.length > 1 ? '混合' : ''}料理`,
      ingredients: (recipeData.ingredients || []).map((ing: any, index: number) => {
        // 检查食材对象的格式，并尝试匹配ID
        const ingredientName = ing.name || ing.ingredient || '';
        
        // 尝试匹配食材ID
        const matchedId = ingredientIds.find(id => {
          const ingredient = ingredients.find(i => i.id === id);
          const ingredientName = ingredient ? ingredient.name : id;
          return ingredientName.includes(id) || id.includes(ingredientName) || 
                 (ing.name && ing.name.includes(ingredientName)) || 
                 (ing.ingredient && ing.ingredient.includes(ingredientName));
        });
        
        return {
          id: matchedId || `other-${index}`, // 添加索引以确保唯一性
          amount: ing.amount || ing.quantity || '适量',
          name: ing.name || ing.ingredient || '其他'
        };
      }),
      steps: recipeData.steps || [],
      difficulty: recipeData.difficulty || 'medium',
      time: parseInt(recipeData.time) || 30,
      tips: recipeData.tips || []
    };
    
    return recipe;
  } catch (error) {
    console.error('生成菜谱失败:', error);
    
    // 返回默认菜谱作为备选
    return {
      name: `AI创意料理：${ingredientNames[0]}${ingredientNames.length > 1 ? '混合' : ''}料理`,
      ingredients: ingredientIds.map(id => ({ id, amount: '适量' })),
      steps: ['准备所有食材', '按照个人喜好烹饪', '装盘即可享用'],
      difficulty: 'medium',
      time: 30,
      tips: ['根据个人口味调整调料', '可以尝试不同的烹饪方法']
    };
  }
}