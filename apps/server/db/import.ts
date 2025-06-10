import 'dotenv/config';
import { db, users, courses, lessons, enrollments, lessonProgress, reviews, categories, certificates } from './index';
import * as fs from 'fs';
import * as path from 'path';

async function importDatabase() {
  console.log('Starting database import...');
  
  try {
    const exportDir = path.join(process.cwd(), 'db', 'exports');
    
    // Check if export directory exists
    if (!fs.existsSync(exportDir)) {
      throw new Error(`Export directory not found: ${exportDir}`);
    }
    
    // Check metadata file
    const metadataPath = path.join(exportDir, 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Metadata file not found. Please ensure you have a complete export.');
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log(`📊 Import summary from export dated ${metadata.exportDate}:`);
    Object.entries(metadata.tables).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
    console.log('\n⚠️  This will insert data into the current database.');
    console.log('Make sure you are connected to the correct database!\n');
    
    // Import tables in correct order (respecting foreign key dependencies)
    
    // 1. Users (no dependencies)
    const usersPath = path.join(exportDir, 'users.json');
    if (fs.existsSync(usersPath)) {
      console.log('Importing users...');
      const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      if (usersData.length > 0) {
        await db.insert(users).values(usersData).onConflictDoNothing();
        console.log(`   ✅ Imported ${usersData.length} users`);
      }
    }
    
    // 2. Categories (no dependencies)
    const categoriesPath = path.join(exportDir, 'categories.json');
    if (fs.existsSync(categoriesPath)) {
      console.log('Importing categories...');
      const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
      if (categoriesData.length > 0) {
        await db.insert(categories).values(categoriesData).onConflictDoNothing();
        console.log(`   ✅ Imported ${categoriesData.length} categories`);
      }
    }
    
    // 3. Courses (depends on users)
    const coursesPath = path.join(exportDir, 'courses.json');
    if (fs.existsSync(coursesPath)) {
      console.log('Importing courses...');
      const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
      if (coursesData.length > 0) {
        await db.insert(courses).values(coursesData).onConflictDoNothing();
        console.log(`   ✅ Imported ${coursesData.length} courses`);
      }
    }
    
    // 4. Lessons (depends on courses)
    const lessonsPath = path.join(exportDir, 'lessons.json');
    if (fs.existsSync(lessonsPath)) {
      console.log('Importing lessons...');
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));
      if (lessonsData.length > 0) {
        await db.insert(lessons).values(lessonsData).onConflictDoNothing();
        console.log(`   ✅ Imported ${lessonsData.length} lessons`);
      }
    }
    
    // 5. Enrollments (depends on users and courses)
    const enrollmentsPath = path.join(exportDir, 'enrollments.json');
    if (fs.existsSync(enrollmentsPath)) {
      console.log('Importing enrollments...');
      const enrollmentsData = JSON.parse(fs.readFileSync(enrollmentsPath, 'utf8'));
      if (enrollmentsData.length > 0) {
        await db.insert(enrollments).values(enrollmentsData).onConflictDoNothing();
        console.log(`   ✅ Imported ${enrollmentsData.length} enrollments`);
      }
    }
    
    // 6. Lesson Progress (depends on users, lessons, and enrollments)
    const lessonProgressPath = path.join(exportDir, 'lesson_progress.json');
    if (fs.existsSync(lessonProgressPath)) {
      console.log('Importing lesson progress...');
      const lessonProgressData = JSON.parse(fs.readFileSync(lessonProgressPath, 'utf8'));
      if (lessonProgressData.length > 0) {
        await db.insert(lessonProgress).values(lessonProgressData).onConflictDoNothing();
        console.log(`   ✅ Imported ${lessonProgressData.length} lesson progress records`);
      }
    }
    
    // 7. Reviews (depends on users and courses)
    const reviewsPath = path.join(exportDir, 'reviews.json');
    if (fs.existsSync(reviewsPath)) {
      console.log('Importing reviews...');
      const reviewsData = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
      if (reviewsData.length > 0) {
        await db.insert(reviews).values(reviewsData).onConflictDoNothing();
        console.log(`   ✅ Imported ${reviewsData.length} reviews`);
      }
    }
    
    // 8. Certificates (depends on users, courses, and enrollments)
    const certificatesPath = path.join(exportDir, 'certificates.json');
    if (fs.existsSync(certificatesPath)) {
      console.log('Importing certificates...');
      const certificatesData = JSON.parse(fs.readFileSync(certificatesPath, 'utf8'));
      if (certificatesData.length > 0) {
        await db.insert(certificates).values(certificatesData).onConflictDoNothing();
        console.log(`   ✅ Imported ${certificatesData.length} certificates`);
      }
    }
    
    console.log('\n✅ Database import completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

importDatabase();