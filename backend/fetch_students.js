const supabase = require('./src/config/supabaseClient');
require('dotenv').config();

async function getStudents() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return;
    }

    console.log(JSON.stringify(data, null, 2));
    console.log(`\nTotal Students: ${data.length}`);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

getStudents();
