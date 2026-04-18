// phonotactic_filter.js

/**
 * Phonotactic Filtering Implementation
 *
 * This module provides functions to filter a sequence of sounds based on phonotactic rules.
 * Phonotactics refers to the rules governing the allowable combinations of sounds in a given language.
 */

// Sample phonotactic rules (can be adjusted for specific language requirements)
const phonotacticRules = {
    // Example rule: Prevent consecutive plosives
    "plosive": true,
    // Add more rules as needed
};

/**
 * Check if the given sequence of sounds adheres to the phonotactic rules.
 *
 * @param {Array} sounds - An array of sounds to check.
 * @returns {Boolean} - True if the sequence adheres to the rules, false otherwise.
 */
function isPhonotacticallyAcceptable(sounds) {
    // Example logic to determine phonotactic acceptability
    for (let i = 0; i < sounds.length - 1; i++) {
        const currentSound = sounds[i];
        const nextSound = sounds[i + 1];

        if (phonotacticRules.plosive && isPlosive(currentSound) && isPlosive(nextSound)) {
            return false; // Violation of rule
        }
        // Add more checks for other rules
    }
    return true; // All checks passed
}

/**
 * Utility function to check if a sound is a plosive.
 *
 * @param {String} sound - The sound to check.
 * @returns {Boolean} - True if the sound is a plosive, false otherwise.
 */
function isPlosive(sound) {
    const plosives = ['p', 't', 'k', 'b', 'd', 'g']; // Define your plosive sounds here
    return plosives.includes(sound);
}

// Exporting the functions for use in other modules
module.exports = {
    isPhonotacticallyAcceptable,
    phonotacticRules,
};