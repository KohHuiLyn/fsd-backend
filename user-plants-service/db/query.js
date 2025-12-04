const isEligiblequery = `
    SELECT EXISTS (
        SELECT 1 FROM user_plants.user_plant_list 
        WHERE 
            id = $1 
            AND user_id = $2
    ) AS eligible;
`;

const insertupQuery = `
    INSERT INTO user_plants.user_plant_list (user_id, s3_id, name, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
`;

const devSelectByIDQuery = `
    SELECT id, user_id, s3_id, name, notes, created_at, updated_at
    FROM user_plants.user_plant_list
    WHERE 
        id = $1;
`;

const devSelectAllQuery = `
    SELECT id, user_id, s3_id, name, notes, created_at, updated_at
    FROM user_plants.user_plant_list
`;

const selectByIDuserIDQuery = `
    SELECT id, user_id, s3_id, name, notes, created_at, updated_at
    FROM user_plants.user_plant_list
    WHERE 
        id = $1 
        AND user_id = $2;
`;

const getByUserIDQuery = `
    SELECT id, user_id, s3_id, name, notes, created_at, updated_at
    FROM user_plants.user_plant_list
    WHERE 
        user_id = $1 
    ORDER BY 
        created_at DESC
`;

const searchQuery = `
    SELECT id, user_id, s3_id, name, notes, created_at, updated_at
    FROM 
        user_plants.user_plant_list
    WHERE 
        user_id = $2
        AND (
                (name    ILIKE $1::text)
            OR (notes    ILIKE $1::text)
        )
    ORDER BY 
        created_at DESC, 
        user_id DESC
    LIMIT $3 OFFSET $4;
`;
// ORDER BY created_at DESC, agent_ID DESC LIMIT 10;

async function dynamicUpdate(fields) {
    const updateQuery = `
        UPDATE user_plants.user_plant_list
        SET 
            ${fields.join(', ')},
            updated_at = now()
        WHERE 
            id = $1
        RETURNING id, user_id, s3_id, name, notes, created_at, updated_at;
    `;
    return updateQuery;
} 

// const softDeleteQuery = `
//     UPDATE user_plants.user_plants_list
//     SET 
//         deleted_by = $2, 
//         deleted_at = now(), 
//         updated_at = now(), 
//         delete_reason = $3
//     WHERE 
//         id = $1
//         AND agent_ID = $2
//         AND deleted_at IS NULL
//     RETURNING id, deleted_at
// `;

const deleteQuery = `
    DELETE FROM user_plants.user_plant_list
    WHERE
        id = $1
    RETURNING id
`;

export {
    isEligiblequery,
    insertupQuery,
    devSelectByIDQuery, devSelectAllQuery,
    selectByIDuserIDQuery, getByUserIDQuery,
    searchQuery,
    dynamicUpdate,
    deleteQuery,
}