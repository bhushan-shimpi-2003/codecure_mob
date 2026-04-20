const supabase = require('./config/supabaseClient');

async function fixPlaywright() {
    const courseId = "ee95ec11-0104-45b1-b742-2347157dfc27";
    
    console.log("Updating Playwright course metadata...");
    await supabase.from('courses').update({
        slug: 'playwright-full-automation',
        category: 'Automation',
        level: 'Intermediate',
        duration: '10h'
    }).eq('id', courseId);

    // Add Modules
    const modules = [
        { title: "Introduction to Playwright", lessons: ["Why Playwright?", "Installation & Setup", "Recording your first test"] },
        { title: "Core Concepts", lessons: ["Selectors & Locators", "Auto-waiting", "Assertions"] },
        { title: "Advanced Automation", lessons: ["Handling Iframes", "Multi-tab Testing", "API Testing with Playwright"] }
    ];

    console.log("Cleaning old modules...");
    await supabase.from('modules').delete().eq('course_id', courseId);
    
    console.log("Inserting new modules and lessons...");
    for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        const { data: modData, error: modError } = await supabase.from('modules').insert({
            course_id: courseId,
            title: m.title,
            module_order: i  // FIXED: module_order is required!
        }).select().single();
        
        if (modError) {
            console.error(`Error inserting module ${m.title}:`, modError);
            continue;
        }

        if (modData) {
            const lessons = m.lessons.map((title, lIdx) => ({
                course_id: courseId,
                module_id: modData.id,
                title: title,
                video_url: "https://www.youtube.com/embed/S_8qM751gks",
                lesson_order: lIdx
            }));
            const { error: lessonError } = await supabase.from('lessons').insert(lessons);
            if (lessonError) console.error(`Error inserting lessons for ${m.title}:`, lessonError);
        }
    }
    console.log("Playwright data fix complete!");
}

fixPlaywright();
