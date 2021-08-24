import { Field, Int, ObjectType, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field(type => Int)
  @IsNumber()
  id: number;

  @Field(type => String)
  @Column()
  @IsString()
  @Length(3, 10)
  name: string;

  @Field(type => Boolean, { defaultValue: true })
  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isVegan?: boolean;

  @Field(type => String)
  @Column()
  @IsString()
  address: string;

  @Field(type => String)
  @Column()
  @IsString()
  ownersName: string;

  @Field(type => String)
  @Column()
  categoryName: string;
}
