struct Uniforms {
    projectionMatrix: mat4x4<f32>,
    viewMatrix: mat4x4<f32>,
    worldMatrix: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var my_texture: texture_2d<f32>;
@group(0) @binding(2) var my_sampler: sampler;

struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
};

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) frag_uv: vec2<f32>,
}

@vertex
fn vs_main(
    model: VertexInput
) -> VertexOutput {
    var output: VertexOutput;
    output.clip_position = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.worldMatrix * model.position;
    output.frag_uv = model.uv;
    return output;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(my_texture, my_sampler, in.frag_uv);
}
