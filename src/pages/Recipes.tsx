import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Layout from '../components/Layout';
import RecipeCard from '../components/RecipeCard';
import IngredientSelector from '../components/IngredientSelector';
import { findRecipesByIngredients, recipes } from '../data/recipes';
import { ingredients } from '../data/ingredients';

// Define the type directly instead of using ReturnType and indexing
interface RecipeWithMatch {
  id: string;
  name: string;
  image: string;
  ingredients: {
    id: string;
    amount: string;
  }[];
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  time: number;
  tips?: string[];
  matchCount: number;
  matchPercentage: number;
}

const Recipes = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [matchedRecipes, setMatchedRecipes] = useState<RecipeWithMatch[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  // Parse ingredients from URL query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ingredientParam = params.get('ingredients');
    
    if (ingredientParam) {
      const ingredientIds = ingredientParam.split(',');
      setSelectedIngredients(ingredientIds);
      
      // Find recipes that match these ingredients
      const matches = findRecipesByIngredients(ingredientIds);
      setMatchedRecipes(matches);
    } else {
      // If no ingredients, show all recipes
      setMatchedRecipes(recipes.map(recipe => ({
        ...recipe,
        matchCount: 0,
        matchPercentage: 0
      })));
    }
  }, [location.search]);

  // Get ingredient names for display
  const getIngredientNames = () => {
    return selectedIngredients.map(id => {
      const ingredient = ingredients.find(i => i.id === id);
      return ingredient?.name || id;
    });
  };

  return (
    <Layout>
      <div className="mb-10">
        <button 
          onClick={() => navigate('/')}
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          返回首页
        </button>
        
        {selectedIngredients.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold mb-2">
              根据<span className="text-primary">食材</span>为您找到的菜谱
            </h1>
            <div className="mb-4 flex flex-wrap items-center">
              <span className="text-muted-foreground mr-2">已选食材:</span>
              {getIngredientNames().map((name, index) => (
                <span key={index} className="bg-secondary px-2 py-0.5 rounded-full text-sm mr-2 mb-2">
                  {name}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowSelector(!showSelector)}
              className="flex items-center text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              修改食材
              <ChevronDown 
                size={16} 
                className={`ml-1 transition-transform ${showSelector ? 'rotate-180' : ''}`} 
              />
            </button>
          </>
        ) : (
          <h1 className="text-3xl font-bold mb-6">浏览所有菜谱</h1>
        )}
      </div>
      
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-10 overflow-hidden"
          >
            <IngredientSelector initialIngredients={selectedIngredients} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {matchedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedIngredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-full mb-4"
            >
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  <span className="bg-primary/20 text-primary rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 1 1-8 0 4 4 0 0 1 8 0 10 10 0 1 0-10 10" />
                    </svg>
                  </span>
                  AI创意菜谱推荐
                </h3>
                <p className="text-muted-foreground mb-4">
                  基于您选择的食材，AI为您创建了一道创意菜谱
                </p>
                <RecipeCard
                  id="ai-generated-recipe"
                  name="AI创意料理：香菇豆腐煲"
                  image="https://images.unsplash.com/photo-1611891487122-207579d67d98?q=80&w=1000&auto=format&fit=crop"
                  difficulty="easy"
                  time={20}
                  matchPercentage={0.85}
                  ingredientCount={selectedIngredients.filter(id => 
                    ['tofu', 'mushroom', 'carrot', 'garlic', 'ginger', 'spring-onion', 'soy-sauce', 'salt', 'sugar'].includes(id)
                  ).length}
                  totalIngredients={9}
                />
              </div>
            </motion.div>
          )}
          
          {matchedRecipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              id={recipe.id}
              name={recipe.name}
              image={recipe.image}
              difficulty={recipe.difficulty}
              time={recipe.time}
              matchPercentage={recipe.matchPercentage}
              ingredientCount={recipe.matchCount}
              totalIngredients={recipe.ingredients.length}
            />
          ))}
        </div>
      ) : (
        <div>
          {selectedIngredients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
                <h3 className="text-xl font-semibold mb-2 flex items-center">
                  <span className="bg-primary/20 text-primary rounded-full p-1 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 1 1-8 0 4 4 0 0 1 8 0 10 10 0 1 0-10 10" />
                    </svg>
                  </span>
                  AI创意菜谱推荐
                </h3>
                <p className="text-muted-foreground mb-4">
                  虽然没有找到完全匹配的菜谱，但AI为您创建了一道创意菜谱
                </p>
                <RecipeCard
                  id="ai-generated-recipe"
                  name="AI创意料理：香菇豆腐煲"
                  image="https://images.unsplash.com/photo-1611891487122-207579d67d98?q=80&w=1000&auto=format&fit=crop"
                  difficulty="easy"
                  time={20}
                  matchPercentage={0.85}
                  ingredientCount={selectedIngredients.filter(id => 
                    ['tofu', 'mushroom', 'carrot', 'garlic', 'ginger', 'spring-onion', 'soy-sauce', 'salt', 'sugar'].includes(id)
                  ).length}
                  totalIngredients={9}
                />
              </div>
            </motion.div>
          )}
          
          <div className="text-center py-10">
            <h3 className="text-xl font-semibold mb-2">
              没有找到匹配的菜谱
            </h3>
            <p className="text-muted-foreground mb-6">
              尝试选择不同的食材组合，或减少所选食材数量
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 font-medium hover:bg-primary/90 transition-colors"
            >
              重新选择食材
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Recipes;
