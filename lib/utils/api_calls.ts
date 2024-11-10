import { UserData } from "../../types";
/**
 * Provides methods for interacting with the API to fetch, create, update, and delete notes.
 */
const API_BASE_URL = process.env.API_BASE_URL || "https://lived-religion-dev.rerum.io/deer-lr/";

export default class ApiService {
  /**
 * Fetches messages from the API, with optional pagination.
 * @param {boolean} global - Indicates whether to fetch global messages or user-specific messages.
 * @param {boolean} published - Indicates whether to fetch only published messages.
 * @param {string} userId - The ID of the user for user-specific messages.
 * @param {number} [limit=150] - The limit of messages per page. Defaults to 150.
 * @param {number} [skip=0] - The iterator to skip messages for pagination.
 * @param {Array} [allResults=[]] - The accumulated results for pagination.
 * @returns {Promise<any[]>} The array of messages fetched from the API.
 */
static async fetchMessages(
  global: boolean,
  published: boolean,
  userId: string,
  limit = 150,
  skip = 0,
  allResults: any[] = []
): Promise<any[]> {
  try {
    const url = `${API_BASE_URL}query?limit=${limit}&skip=${skip}`;
    const headers = {
      "Content-Type": "application/json",
    };

    let body: { type: string; published?: boolean; creator?: string } = {
      type: "message",
    };

    if (global) {
      body = { type: "message" };
    } else if (published) {
      body = { type: "message", published: true }; // For published messages, no specific creator
    } else {
      body = { type: "message", creator: userId };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
   
    if (data.length > 0) {
      allResults = allResults.concat(data);
      return this.fetchMessages(global, published, userId, limit, skip + data.length, allResults);
    }

    return allResults;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}
  /**
   * Fetches user data from the API based on UID.
   * @param {string} uid - The UID of the user.
   * @returns {Promise<UserData | null>} The user data.
   */
  static async fetchUserData(uid: string): Promise<UserData | null> {
    try {
      const url = `${API_BASE_URL}query`
      const headers = {
        "Content-Type": "application/json",
      };
      const body = {
        "$or": [
          { "@type": "Agent", "uid": uid },
          { "@type": "foaf:Agent", "uid": uid }
        ]
      };

      console.log(`Querying for user data with UID: ${uid}`);

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log(`User Data:`, data);
      return data.length ? data[0] : null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  }


 /**
 * Fetches the name of the creator by querying the API with the given creatorId.
 * @param {string} creatorId - The UID of the creator.
 * @returns {Promise<string>} The name of the creator.
 */
static async fetchCreatorName(creatorId: string): Promise<string> {
  try {
    const url = `${API_BASE_URL}query`
    const headers = {
      "Content-Type": "application/json",
    };
    const body = {
      "$or": [
        { "@type": "Agent", "uid": creatorId },
        { "@type": "foaf:Agent", "uid": creatorId }
      ]
    };

    console.log(`Querying with UID: ${creatorId}`);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(`Received data:`, data);

    // Check if data is a non-empty array and contains a name attribute
    if (Array.isArray(data) && data.length > 0 && data[0].name) {
      return data[0].name;
    } else if (Array.isArray(data) && data.length > 0) {
      console.warn(`Creator found but 'name' attribute is missing for UID: ${creatorId}`);
      return "Unknown Creator";
    } else {
      console.warn(`Creator not found for UID: ${creatorId}`);
      return "Creator not available";
    }
  } catch (error) {
    console.error(`Error fetching creator name:`, error, creatorId);
    return "Error retrieving creator";
  }
}

  
    /**
     * Creates user data in the API.
     * @param {UserData} userData - The user data to be created.
     * @returns {Promise<Response>} The response from the API.
     */
    static async createUserData(userData: UserData) {
      try {
        const response = await fetch(`${API_BASE_URL}create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "@type": "Agent",
            ...userData,
          }),
        });
        return response;
      } catch (error) {
        console.error("Error creating user data:", error);
        throw error;
      }
    }
  
  /**
   * Deletes a note from the API.
   * @param {string} id - The ID of the note to delete.
   * @param {string} userId - The ID of the user who owns the note.
   * @returns {Promise<boolean>} A boolean indicating whether the deletion was successful.
   */
  static async deleteNoteFromAPI(id: string, userId: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}delete`;
      const headers = {
        "Content-Type": "text/plain; charset=utf-8",
      };
      const body = {
        type: "message",
        creator: userId,
        "@id": id,
      };

      const response = await fetch(url, {
        method: "DELETE",
        headers,
        body: JSON.stringify(body),
      });

      if (response.status === 204) {
        return true;
      } else {
        throw response;
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      return false;
    }
  }

  /**
   * Writes a new note to the API.
   * @param {any} note - The note object to be created.
   * @returns {Promise<Response>} The response from the API.
   */
  static async writeNewNote(note: any) {
    return fetch(`${API_BASE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "message",
        title: note.title,
        media: note.media,
        BodyText: note.text,
        creator: note.creator,
        latitude: note.latitude || "",
        longitude: note.longitude || "",
        audio: note.audio,
        published: note.published,
        tags: note.tags,
        time: note.time || new Date (),
      }),
    });
  }

  /**
   * Overwrites an existing note in the API.
   * @param {any} note - The note object to be updated.
   * @returns {Promise<Response>} The response from the API.
   */
  static async overwriteNote(note: any) {
    return await fetch(`${API_BASE_URL}overwrite`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "@id": note.id,
        title: note.title,
        BodyText: note.text,
        type: "message",
        creator: note.creator,
        media: note.media,
        latitude: note.latitude,
        longitude: note.longitude,
        audio: note.audio,
        published: note.published,
        tags: note.tags,
        time: note.time,
      }),
    });
  }

  static async searchMessages(query: string): Promise<any[]> {
    try {
      const url = `${API_BASE_URL}query`;
      const headers = {
        "Content-Type": "application/json",
      };
  
      // Request body for retrieving messages of type "message"
      const body = {
        type: "message",
      };
  
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
  
      let data = await response.json();
  
      // Convert the query to lowercase for case-insensitive matching
      const lowerCaseQuery = query.toLowerCase();
  
      // Filter the messages by title or tags containing the query string
      data = data.filter((message: any) => {
        // Check if title contains the query string
        if (message.title && message.title.toLowerCase().includes(lowerCaseQuery)) {
          return true;
        }
  
        // Check if any tags contain the query string
        if (message.tags && message.tags.some((tag: string) => tag.toLowerCase().includes(lowerCaseQuery))) {
          return true;
        }
  
        return false;
      });
  
      return data;
    } catch (error) {
      console.error("Error searching messages:", error);
      throw error;
    }
  }
  
  
}
