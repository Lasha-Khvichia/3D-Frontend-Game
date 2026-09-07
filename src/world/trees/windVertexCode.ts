/**
 * The wind, as it runs on the GPU.
 *
 * Injected into the standard material's vertex shader at the point where the
 * vertex has just been put into world space. Three motions are added together,
 * which is how vegetation wind is done everywhere:
 *
 * - **Trunk bend**, slow and rising with the square of height, so the whole
 *   tree leans and the base stays planted.
 * - **Branch sway**, medium, rising with distance out from the trunk, so limb
 *   ends move more than the wood near the middle.
 * - **Leaf flutter**, fast and small, and only turned up on the leaf material.
 *
 * Everything comes from the vertex's own world position and `world`, the mesh's
 * matrix, whose translation is the foot of this tree. No per-vertex data and no
 * extra buffers: with thin instances Babylon builds `finalWorld = world *
 * instance`, so `world[3]` is the tree and the difference is the offset within
 * it.
 *
 * The phase comes from where the tree stands, so no two trees in the wood move
 * together.
 */
export const WIND_VERTEX_CODE = `
#ifdef TREEWIND
{
    vec3 fromTrunk = worldPos.xyz - world[3].xyz;
    float up = max(fromTrunk.y, 0.0);
    float spread = length(fromTrunk.xz);
    float phase = dot(world[3].xz, vec2(0.37, 0.71));

    float gust = 0.72 + 0.28 * sin(windTime * 0.21 + phase * 0.5);
    float lean = sin(windTime * 0.9 + phase);
    float swing = sin(windTime * 2.3 + phase + spread * 0.7);
    float shiver = sin(windTime * 8.1 + phase + up * 2.3 + spread * 4.1);
    float shiverSide = cos(windTime * 6.7 + phase + spread * 3.3);

    vec2 alongWind = windDirection * gust;
    float bend = up * up * windBend * lean;
    float sway = spread * windSway * swing;

    worldPos.xz += alongWind * (bend + sway);
    worldPos.xz += vec2(shiver, shiverSide) * windFlutter;
    // Wood does not stretch: leaning a branch over shortens its reach a little.
    worldPos.y -= abs(bend) * 0.35;
}
#endif
`;
