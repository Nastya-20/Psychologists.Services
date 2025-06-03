import { database } from "../firebase";
import { ref, set, push } from "firebase/database";

export function addPsychologist(psychologistData) {
  const psychologistRef = push(ref(database, "psychologists")); 
  return set(psychologistRef, psychologistData)
    .then(() => {
      console.log("Psychologist added successfully!");
    })
    .catch((error) => {
      console.error("Error adding psychologist:", error);
    });
}