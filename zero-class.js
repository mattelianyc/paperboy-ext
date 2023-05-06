// get all class names from page
function getAllClassNames() {
  const elements = document.querySelectorAll('*');
  const classNames = new Set();

  elements.forEach(element => {
    if (typeof element.className === 'string' && element.className.trim() !== '') {
      const classes = element.className.split(' ');
      classes.forEach(className => {
        classNames.add(className);
      });
    }
  });

  const uniqueClassNames = Array.from(classNames);
  return uniqueClassNames;
}

// query GPT to determine the method of obfuscation being employed
// if obfuscation is present, determine the regex filter to circumvent inclusion in the query selector
async function getClassFilterRegex(classNames) {
  try {
    const response = await fetch('http://localhost:3333/api/class-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ classNames }),
    });

    if (response.ok) {
      const { obfuscationPattern } = await response.json();
      // Update the following line to create the regex based on the obfuscationPattern provided by GPT
      return new RegExp(obfuscationPattern);
    } else {
      throw new Error('Failed to fetch obfuscation pattern');
    }
  } catch (error) {
    console.error('Error in getClassFilterRegex:', error);
    return new RegExp('');
  }
}

async function filterClassNames(classList) {
  const classFilterRegex = await getClassFilterRegex(Array.from(classList));
  return Array.from(classList).filter(className => !classFilterRegex.test(className)).join(' ');
}

(async function main() {
  const classNames = getAllClassNames();
  const filteredClassNames = await filterClassNames(classNames);
  console.log(filteredClassNames);
})();