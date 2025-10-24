<template>
  <div class="category-node">
    <div 
      class="node-content"
      :class="{ 
        'selected': selectedCategory && selectedCategory.id === category.id,
        'has-children': hasChildren,
        'expanded': isExpanded 
      }"
    >
      <span 
        v-if="hasChildren" 
        class="expand-icon"
        :class="{ 'expanded': isExpanded }"
        @click="toggleNode"
      >
        ▶
      </span>
      <span v-else class="no-icon"></span>
      
      <span class="category-name" @click="selectCategory">
        {{ category.name }}
      </span>
    </div>
    
    <div v-if="isExpanded && hasChildren" class="children">
      <CategoryNode
        v-for="child in getChildren(category.name)"
        :key="child.id"
        :category="child"
        :children="getChildren(child.name)"
        :all-categories="allCategories"
        :selected-category="selectedCategory"
        :category-map="categoryMap"
        @category-selected="$emit('category-selected', $event)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CategoryNode',
  props: {
    category: {
      type: Object,
      required: true
    },
    children: {
      type: Array,
      default: () => []
    },
    allCategories: {
      type: Array,
      default: () => []
    },
    selectedCategory: {
      type: Object,
      default: null
    },
    categoryMap: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      isExpanded: false
    }
  },
  computed: {
    hasChildren() {
      console.log(`🔍 Checking children for ${this.category.name}:`)
      console.log(`   - category_code: ${this.category.category_code}`)
      console.log(`   - allCategories length: ${this.allCategories.length}`)
      console.log(`   - children prop length: ${this.children.length}`)
      
      const dynamicChildren = this.getChildren(this.category.name)
      console.log(`   - dynamic children found: ${dynamicChildren.length}`)
      console.log(`   - dynamic children names:`, dynamicChildren.map(c => c.name))
      
      return dynamicChildren.length > 0
    }
  },
  watch: {
    selectedCategory: {
      handler(newSelected) {
        if (newSelected && this.isPathToSelected(newSelected)) {
          this.isExpanded = true
        }
      },
      immediate: true
    }
  },
  methods: {
    toggleNode() {
      const dynamicChildren = this.getChildren(this.category.category_code)
      console.log(`🔄 Toggle node "${this.category.name}" (children prop: ${this.children.length}, dynamic: ${dynamicChildren.length})`)
      console.log(`🔍 Children for ${this.category.name}:`, dynamicChildren.map(c => c.name))
      if (this.hasChildren) {
        this.isExpanded = !this.isExpanded
        console.log(`📂 ${this.category.name} is now ${this.isExpanded ? 'expanded' : 'collapsed'}`)
      } else {
        console.log(`⚠️  No children found for ${this.category.name} (category_code: ${this.category.category_code})`)
      }
    },
    
    selectCategory(event) {
      event.stopPropagation()
      console.log(`🎯 Selected category "${this.category.name}" (ID: ${this.category.id})`)
      this.$emit('category-selected', this.category)
    },
    
    getChildren(parentCode) {
      console.log(`🔎 getChildren called with parentCode: "${parentCode}"`)
      console.log(`🔎 allCategories.length: ${this.allCategories.length}`)
      if (this.allCategories.length > 0) {
        console.log(`🔎 Sample categories:`, this.allCategories.slice(0, 3).map(c => `${c.name} (parent: ${c.parent_code})`))
      }
      
      // Try matching by both category_code and category name
      const resultByCode = this.allCategories.filter(cat => cat.parent_code === parentCode)
      const resultByName = this.allCategories.filter(cat => cat.parent_code === this.category.name)
      
      console.log(`🔎 Found ${resultByCode.length} children by code "${parentCode}":`, resultByCode.map(c => c.name))
      console.log(`🔎 Found ${resultByName.length} children by name "${this.category.name}":`, resultByName.map(c => c.name))
      
      // Use the result that found children
      const result = resultByName.length > 0 ? resultByName : resultByCode
      console.log(`🔎 Using ${result.length} children:`, result.map(c => c.name))
      return result
    },
    
    isPathToSelected(selected) {
      if (!selected) return false

      let current = selected
      while (current && current.parent_code) {
        if (current.parent_code === this.category.category_code) {
          return true
        }
        // Use categoryMap prop instead of traversing parent components
        current = this.categoryMap[current.parent_code] || null
      }
      return false
    }
  }
}
</script>

<style scoped>
.category-node {
  margin-left: 0;
}

.node-content {
  display: flex;
  align-items: center;
  padding: 3px 6px;
  cursor: pointer;
  border-radius: 3px;
  margin: 0.5px 0;
  transition: all 0.2s ease;
  font-size: 11px;
  position: relative;
  border: 1px solid transparent;
  line-height: 1.3;
}

.node-content:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-color: #dee2e6;
  transform: translateX(2px);
}

.node-content.selected {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.3);
  border-color: #0056b3;
}

.node-content.selected:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateX(2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
}

.expand-icon {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  font-size: 8px;
  color: #6c757d;
  transition: all 0.2s ease;
  border-radius: 2px;
  background: #f8f9fa;
}

.expand-icon.expanded {
  transform: rotate(90deg);
  background: #e9ecef;
  color: #495057;
}

.node-content.selected .expand-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.node-content.selected .expand-icon.expanded {
  background: rgba(255, 255, 255, 0.3);
}

.no-icon {
  width: 12px;
  margin-right: 4px;
  position: relative;
}

.no-icon::before {
  content: "•";
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 6px;
  color: #adb5bd;
}

.node-content.selected .no-icon::before {
  color: rgba(255, 255, 255, 0.7);
}

.category-name {
  flex: 1;
  word-break: break-word;
  line-height: 1.4;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.children {
  margin-left: 12px;
  border-left: 1px solid #f1f3f4;
  padding-left: 6px;
  margin-top: 1px;
  position: relative;
}

.children::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #dee2e6 0%, transparent 100%);
}

.node-content.has-children {
  font-weight: 600;
}

.node-content.expanded {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  border-color: #dee2e6;
}

.node-content.expanded.selected {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  border-color: #0056b3;
}

.node-content:active {
  transform: scale(0.98);
}
</style>