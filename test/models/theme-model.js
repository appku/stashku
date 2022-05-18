class ThemeModel {
    constructor() {
        
        /**
         * @type {Number}
         */
        this.ID = this.constructor.ID.default ?? null;
        
        /**
         * @type {String}
         */
        this.Name = this.constructor.Name.default ?? null;
        
        /**
         * @type {String}
         */
        this.HexCode = this.constructor.HexCode.default ?? null;
        
    }

    get NameAndHex() {
        return this.Name + this.HexCode;
    }
    
    /**
     * StashKu property definition for ID.
     * @type {Modeling.PropertyDefinition}
     */
    static get ID() {
        return {
            target: 'ID',
            default: 1,
            pk: true,
            omit: {
                post: true
            },
            type: 'Number'
        };
    }
    
    /**
     * StashKu property definition for Name.
     * @type {Modeling.PropertyDefinition}
     */
    static get Name() {
        return {
            target: 'Name',
            type: 'String',
            omit: {
                delete: true
            }
        };
    }
    
    /**
     * StashKu property definition for Hex_Code.
     * @type {Modeling.PropertyDefinition}
     */
    static get HexCode() {
        return {
            target: 'Hex_Code',
            type: 'String',
            omit: {
                delete: true
            }
        };
    }
    
    /**
     * The StashKu resource configuration for this model.
     * @type {Modeling.Configuration}
     */
    static get $stashku() {
        return {
            resource: 'themes',
            name: 'Theme',
            slug: 'theme',
            plural: {
                name: 'Themes',
                slug: 'themes'
            }
        };
    }
    
}

export default ThemeModel;