# Quick Start Guide - Prisma Schema Fix Script

## 🚀 Quick Start

### Step 1: Run the Script

```bash
node fix-prisma-schema.js
```

### Step 2: Analyze Your Codebase

Select option **1** to see all issues:
```
1. Analyze Prisma schema and codebase
```

This will show you:
- All Prisma models found in schema
- All backend issues (model names and field names)
- All frontend issues (field names)
- Total count of issues

### Step 3: Choose Your Fix Strategy

You have three options:

#### Option A: Fix Everything at Once (Recommended for First Time)
Select option **5** - "Fix all issues (backend + frontend)"
- Creates backups automatically
- Fixes all issues in one go
- Best for initial cleanup

#### Option B: Fix by Category
- **Option 2**: Fix backend model names only
- **Option 3**: Fix backend field names only
- **Option 4**: Fix frontend field names only
- Good for incremental fixes

#### Option C: Review Before Fixing
- **Option 7**: View specific files to see what will change
- **Option 6**: Show summary without fixing
- Good for cautious approach

### Step 4: Confirm and Apply

The script will ask for confirmation:
```
Do you want to apply these fixes? (y/n): y
```

Type `y` and press Enter to apply fixes.

### Step 5: Verify

After fixes are applied:
1. Check the backup location: `./backups/prisma-fixes/`
2. Test your application
3. If issues occur, restore from backup

## 📋 Common Scenarios

### Scenario 1: First-Time Setup

```
1. Run: node fix-prisma-schema.js
2. Select: 1 (Analyze)
3. Review issues
4. Select: 5 (Fix all)
5. Confirm: y
6. Test application
```

### Scenario 2: Incremental Fixes

```
1. Run: node fix-prisma-schema.js
2. Select: 2 (Fix backend model names)
3. Confirm: y
4. Test backend
5. Run again: node fix-prisma-schema.js
6. Select: 3 (Fix backend field names)
7. Confirm: y
8. Test backend
9. Run again: node fix-prisma-schema.js
10. Select: 4 (Fix frontend field names)
11. Confirm: y
12. Test frontend
```

### Scenario 3: Review Before Fixing

```
1. Run: node fix-prisma-schema.js
2. Select: 1 (Analyze)
3. Note problematic files
4. Select: 7 (View specific file)
5. Enter file path from analysis
6. Review code
7. Exit: 8
8. Manually review if needed
9. Run again and fix
```

## 🔍 Understanding the Output

### Issues Summary Example

```
================================================================================
📊 ISSUES SUMMARY
================================================================================

🔹 Backend Issues: 45

Backend Model Name Issues:
  [backend/controllers/userController.js:15] user → users (3 occurrences)
  [backend/services/orderService.js:23] order → orders (5 occurrences)

Backend Field Name Issues:
  [backend/controllers/userController.js:18] firstName → first_name (2 occurrences)
  [backend/services/orderService.js:27] createdAt → created_at (4 occurrences)

🔹 Frontend Issues: 78

Frontend Field Name Issues:
  [frontend/src/components/UserProfile.tsx:12] first_name → firstName (3 occurrences)
  [frontend/src/app/orders/page.tsx:45] created_at → createdAt (6 occurrences)

🔹 Total Issues: 123
================================================================================
```

### What This Means

- **[file:line]**: Location of the issue
- **incorrect → correct**: What will be changed
- **(N occurrences)**: How many times this appears in the file

## 💡 Tips

### Before Running

1. **Commit Your Changes**: Make sure your Git working directory is clean
   ```bash
   git status
   git add .
   git commit -m "Before Prisma fixes"
   ```

2. **Know Your Schema**: Understand your Prisma schema structure
3. **Backup Strategy**: Decide if you want to keep backups

### During Execution

1. **Read the Output**: Pay attention to what will be changed
2. **Confirm Carefully**: Only confirm if you're sure
3. **Watch for Errors**: Note any error messages

### After Execution

1. **Test Thoroughly**:
   - Run backend server
   - Run frontend dev server
   - Test critical features
   - Check database operations

2. **Review Changes**:
   ```bash
   git diff
   ```

3. **Commit Fixes**:
   ```bash
   git add .
   git commit -m "Fix Prisma schema naming mismatches"
   ```

## 🛠️ Troubleshooting

### Issue: Script Won't Run

**Symptom**: `node: command not found`

**Solution**: Install Node.js
```bash
# Check if Node.js is installed
node --version

# If not installed, download from https://nodejs.org/
```

### Issue: No Issues Found

**Symptom**: Script reports 0 issues

**Possible Causes**:
1. All issues already fixed
2. Codebase follows correct conventions
3. Schema path is incorrect

**Solution**:
1. Verify schema path in CONFIG
2. Check if your code needs fixing
3. Review Prisma schema manually

### Issue: Fixes Break Application

**Symptom**: Application errors after fixes

**Solution**: Restore from backup
```bash
# Find latest backup
ls -la ./backups/prisma-fixes/

# Copy files back
cp -r ./backups/prisma-fixes/backup-YYYY-MM-DDTHH-MM-SS-mmmZ/* ./
```

### Issue: Too Many Issues

**Symptom**: Hundreds or thousands of issues found

**Solution**: Fix incrementally
1. Start with model names (option 2)
2. Then field names (option 3)
3. Test after each step
4. Fix frontend last (option 4)

## 📊 Expected Results

### Typical Project

For a typical B2C e-commerce project:

- **Backend Files**: 100-200 files
- **Frontend Files**: 200-400 files
- **Model Name Issues**: 10-50
- **Field Name Issues**: 100-500
- **Total Fix Time**: 2-10 minutes

### After Fixes

Your codebase should:
- ✅ Use correct plural model names in backend
- ✅ Use snake_case field names in backend
- ✅ Use camelCase field names in frontend
- ✅ Match Prisma schema conventions
- ✅ Work correctly with Prisma Client

## 🎯 Best Practices

1. **Start Fresh**: Run on clean Git working directory
2. **Analyze First**: Always run option 1 before fixing
3. **Test Incrementally**: Test after each fix category
4. **Keep Backups**: Don't delete until thoroughly tested
5. **Document Changes**: Commit with descriptive messages
6. **Team Communication**: Let team know about naming convention changes

## 📚 Additional Resources

- **Full Documentation**: See `PRISMA_FIX_SCRIPT_README.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **Naming Conventions**: Follow your team's style guide

## 🆘 Getting Help

If you encounter issues:

1. Check this quick start guide
2. Read the full README
3. Review backup files
4. Check Prisma schema
5. Consult your team

## ✅ Checklist

Before running the script:
- [ ] Node.js installed
- [ ] In project root directory
- [ ] Git working directory clean
- [ ] Understand the changes
- [ ] Have time to test after

After running the script:
- [ ] Reviewed the changes
- [ ] Tested backend functionality
- [ ] Tested frontend functionality
- [ ] No errors in console
- [ ] Database operations work
- [ ] Committed changes to Git
- [ ] Team notified of changes

---

**Ready to fix your Prisma schema issues? Run:**

```bash
node fix-prisma-schema.js
```

**Good luck! 🚀**
