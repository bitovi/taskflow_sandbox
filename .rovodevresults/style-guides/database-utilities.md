# Database Utilities Style Guide

## Unique Patterns and Conventions

### 1. CommonJS Module Pattern
Database utilities use CommonJS syntax for Node.js compatibility:

```javascript
// prisma/seed.js
const { PrismaClient } = require('../app/generated/prisma');
const bcrypt = require('bcryptjs');
```

### 2. Password Hashing in Seeds
Consistent password hashing with 10 salt rounds:

```javascript
const hashedPassword = await bcrypt.hash('password123', 10);
const user = await prisma.user.create({
    data: {
        ...userData,
        password: hashedPassword,
    },
});
```

### 3. Async Main Function Pattern
Database scripts use async main functions with proper error handling:

```javascript
async function main() {
    console.log('🌱 Starting database seed...');
    
    // Seeding logic here
    
    console.log('✅ Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
```

### 4. Template-Based Data Generation
Use template arrays with randomization for realistic data:

```javascript
const taskTemplates = [
    { name: "Fix bug in user authentication", description: "Investigate and resolve login issues", priority: "high" },
    { name: "Update documentation", description: "Review and update API docs", priority: "medium" },
    // ... more templates
];

// Generate tasks using templates
for (let i = 0; i < 30; i++) {
    const template = getRandomElement(taskTemplates);
    // Use template data
}
```

### 5. Relationship Assignment Pattern
Handle optional relationships with probability-based assignment:

```javascript
const creator = getRandomElement(createdUsers);
const assignee = Math.random() > 0.2 ? getRandomElement(createdUsers) : null;

await prisma.task.create({
    data: {
        creatorId: creator.id,
        assigneeId: assignee?.id || null,
    },
});
```

### 6. Random Date Generation
Generate realistic dates within specific ranges:

```javascript
function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 30);
const hasDueDate = Math.random() > 0.5;

dueDate: hasDueDate ? getRandomDate(new Date(), futureDate) : null,
```

### 7. Clear/Reset Pattern
Database clearing scripts use deleteMany operations:

```javascript
// prisma/clear.js
async function main() {
    console.log('🧹 Clearing database...');
    
    // Delete in correct order due to foreign key constraints
    await prisma.task.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleared!');
}
```

### 8. Helper Function Export
Export utility functions for reuse in tests:

```javascript
// Helper functions for random data generation
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

module.exports = {
    getRandomElement,
    getRandomDate
};
```

### 9. Console Logging Pattern
Consistent emoji-based logging for script feedback:

```javascript
console.log('🌱 Starting database seed...');
console.log('✅ Database seeded successfully!');
console.log('❌ Seeding failed:', e);
console.log('🧹 Clearing database...');
```