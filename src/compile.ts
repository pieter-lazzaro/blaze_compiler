import schema = require('../src/schema');
import rules = require('../src/rules');
import expression = require('../src/expression');
import fs = require('fs');

export function compile(path:string):string{
    //convert to JSON
    var json:string = rules.load_yaml(path);

    //check user's JSON meets JSON schema spec of rule file
    var ok = rules.validate_rules(json);

    if(ok){
        //convert users rule file into a model
        var model:rules.Rules = rules.Rules.parse(json);

        //first pass of compiler,
        //metaschema generate constraints for schema
        schema.annotate(model);

        console.log("\nannotated model:");
        console.log(model.schema.root);

        //second pass of compiler
        //constraints pushed into leaves
        schema.flattenConstraints(model);
        console.log("\nflattened model:");
        console.log(model.schema.root);

        //3rd pass pass of compiler, unifying ACL and the schema
        schema.combineACL(model);
        console.log("\n ACL and schema:");
        console.log(model.schema.root);

        //generate output in security rules 1.0
        //only leaf nodes are used to avoid higher ups overwriting security
        //just leaves might be an issue
        var code:string = schema.generateRules(model);

        //print generate code out
        console.log("\ngenerated code:");
        console.log(code);

        //write to file
        fs.writeFileSync("rules.json", code);
        return code;
    }else{
        return null;
    }
}