/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 
 * Set Data Structure
 * @class Set
 * @author Lee Boonstra
 *
 *      Set objects are collections of values.
 *      You can iterate through the elements of a set in insertion order.
 *      A value in the Set may only occur once; it is unique in the Set's collection.
 *      Because each value in the Set has to be unique, the value equality will be checked.
 *
 *      Since Set only contains distinct elements, it makes life much easier if we know in advance
 *      we want to avoid saving duplicate data to our structure.
 *      In Mathematics, it has concepts such as union, difference and intersection.
 *
 */
export class Set {
    public items: Object;
    public total: number;

    constructor() {
        this.items = {}; // note it's an object, so you can store only one key.
        this.total = 0;
    }

    /**
     * Check if the value exist. If not, add it to the set.
     *
     * @param {string | object} element - String name value will be used as key and value
     */
    add(value: string | object) {
        let isCreated = false;
        if (!this.has(value)) {
            this.items[this.total] = value;
            isCreated = true;
            this.total++;
        }
        return isCreated;
    }

    /**
     * Remove value from the set
     *
     * @param {string} value - String name value will be used as key and value
     */
    delete(value: string) {
        let isRemoved = false;
        if (this.has(value)) {
            delete this.items[value];
            isRemoved = true;
            this.total--;
        }
        return isRemoved;
    }

    /**
     * Check if the value exist.
     * Returns a boolean asserting whether an element is present with the given value in the Set object or not.
     *
     * @param {string} value - the value
     * @return {boolean} isExisting - Boolean, returns true if value exists in Set.
     */
    has(value: string | object): boolean | any {
        let isExisting = false;
        for (let key in this.items) {

            if (this.items.hasOwnProperty(key)) {
                 if (this.items[key] === value ) {
                     if (parseInt(key) <= this.size()) {
                        isExisting = true;
                     }
                 }
            }
        }
        return isExisting;
    }

    /**
     * Returns an array with all the keys of the Set
     *
     * @return {array} keys - Array with all the keys of the set
     */
    keys(): any[] {
        let arr = [];
        for (let item in this.items) {
            arr.push(item)
        }

        return arr;
    }

    /**
     * Returns an array with all the values of the Set
     *
     * @return {array} values - Array with all the values of the set
     */
    values(): any[] {
        let arr = [];
        for (let item in this.items) {
            arr.push(this.items[item]);
        }

        return arr;
    }

    /**
    * Removes all elements from the Set object.
    */
    clear(): void {
        this.items = {};
        this.total = 0;
    }

    /**
    * Returns the number of values in the Set object.
    *
    * @return {number} total - Total amount of items in Set
    */
    size(): number {
        return this.total;
    }

   /**
    * Executes the callback function, for each item in the Set.
    *
    * @param {function} callback(key, val, set) - Callback function with 3 args key, value and set.
    */
    forEach(callback: Function): void {
        for (let key in this.items) {
            callback(key, this.items[key], this.items);
        }
    }

    /**
    * Check if the Stack is empty. Returns true if the stack has no items
    * Take O(1) time. We do not run any loop in any of these operations.
    *
    * @returns {boolean} isEmpty - if the Stack is empty or not
    */
    isEmpty(): boolean {
        return (this.total === 0);
    }

    /**
     * Given two sets, this returns a new set of elements from both of the given sets.
     *
     * @param {Set} otherSet - Another Set
     * @return {Set} unionSet - Return a combined set.
     */
    union(otherSet: Set): Set {
        let unionSet = new Set();

        this.forEach(function(_key: number, val: string) {
            unionSet.add(val)
        });
        otherSet.forEach(function(_key: number, val: string) {
            unionSet.add(val)
        });

        return unionSet;
    }

    /**
     * Given two sets, this returns a new set from elements that exist in both sets.
     *
     * @param {Set} otherSet - Another Set
     * @return {Set} intersection - Return a intersection set.
     */
    intersection(otherSet: Set): Set {
        let intersection = new Set();

        this.forEach(function(_key: number, val: string) {
            if (otherSet.has(val)) {
                intersection.add(val);
            }
        });
        return intersection;
    }

    /**
     * Given two sets, this returns a new set with all the elements that
     * exist in your set but not in the other set.
     *
     * @param {Set} otherSet - Another Set
     * @return {Set} difference - Return a difference set.
     */
    difference(otherSet: Set): Set {
        let difference = new Set();

        this.forEach(function(_key: number, val: string) {
            if (!otherSet.has(val)) {
                difference.add(val);
            }
        });

        return difference;
    }

    /**
     * Given two sets, confirm with a boolean if this is a subset of another set.
     *
     * @param {Set} otherSet - Another Set
     * @return {boolean} isSubset - Return boolean true if this is a subset.
     */
    isSubset(otherSet: Set): boolean {
        let isSubset = false;
        let counter = 0;

        // if this set is bigger than the other set, it can't be a subset
        if (this.size() <= otherSet.size()) {
            // loop through all items, and check if my values
            // also exist in the other set.
            // all values will need to exist.
            this.forEach(function(_key: number, val: string) {
                if (otherSet.has(val)) {
                    counter++;
                }
            });
        }

        if (counter === this.size()) {
            isSubset = true;
        }

        return isSubset;
    }
}

let dir = new Set();
dir.add({
    name: 'fileName',
    size: '200'
});


type file = {
    name: string,
    size: number,
    status?: string
}

export class FileDirectory extends Set {
    /**
     * Check if the file name exist.
     * Returns a boolean asserting whether a file.name is present with the given value in the FileDirectory object or not.
     *
     * @param {file} file -  { name: 'filename', size: 200 }
     * @return {object} isExisting - Object, returns file if exists, else null
     */
    has(file: file): file {
        for (let key in this.items) {
            if (this.items.hasOwnProperty(key)) {
                 if (this.items[key].name === file.name ) {
                     if (parseInt(key) <= this.size()) {
                        return file;
                     }
                 }
            }
        }
        return null;
    }

    diff(otherFileDir: FileDirectory): FileDirectory {
        let difference = new FileDirectory();
        let me = this;

        this.forEach(function(_key: number, file: file) {
            // the file does not exist in the other directory
            // thus the file is new
            let otherFile = otherFileDir.has(file);
            if (!otherFile) {
                let f = {
                    name: file.name,
                    size: file.size,
                    status: 'new'
                }
                difference.add(f);
            } else {
                if (otherFile.size != file.size) {
                    // the file exists in both directories but thte file size differs
                    // thus the file has been edited
                    let f = {
                        name: file.name,
                        size: file.size,
                        status: 'edited'
                    }
                    difference.add(f); 
                }
            }
        });

        otherFileDir.forEach(function(_key: number, file: file) {
            // the file exists in the other directory, not in the current.
            // thus the file is removed
            if (!me.has(file)) {
                let f = {
                    name: file.name,
                    size: file.size,
                    status: 'removed'
                }
                difference.add(f);
            }
        });

        return difference;
    }
}